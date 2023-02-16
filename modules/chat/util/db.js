/** @type {import('../../../src/database/db')} */
const db = require(process.database)
const moduleCache = require(process.modules)

const { hashing } = moduleCache.require('hashing')
const { escape } = moduleCache.require('html_escape')

const logger = process.logger('chat')


/// Private definitions

const tables = ['User', 'UserProfile', 'UserAccount', 'Chat', 'Message']
const targets = {
    user: ['User.userId', 'User.profileId', 'User.accountId'],
    userProfile: ['UserProfile.profileId', 'UserProfile.userName', 'UserProfile.userDescription', 'UserProfile.profilePicture'],
    userAccount: ['UserAccount.accountId', 'UserAccount.email', 'UserAccount.twoFAEnabled'],
    chat: ['Chat.chatId', 'Chat.participant1', 'Chat.participant2'],
    message: ['Message.msgId', 'Message.data', 'Message.sentOnAt', 'Message.author', 'Message.chat']
}
const { user, userProfile, userAccount, chat, message } = targets

const joinUserProfile = 'User.profileId = UserProfile.profileId'
const joinUserAccount = 'User.accountId = UserAccount.accountId'

/**
 * @param {string[]} targets 
 * @param {number[]} tableIndices 
 * @param {string[]} where 
 * @returns {string}
 */
function buildQuery(targets, tableIndices, where) {
    return `SELECT ${targets.join(', ')} FROM ${tableIndices.map(v => tables[v]).join(', ')} WHERE ${where.join(' AND ')}`
}


// query functions

const getAllUsersQuery = buildQuery([...user, ...userProfile.slice(1, 3), ...userAccount.slice(1)], [0, 1, 2], [joinUserProfile, joinUserAccount])
async function getAllUsersRaw() {
    try {
        const query = await db.query(getAllUsersQuery)
        return query.results
    } catch (error) {
        logger.error('Something went wrong while attempting to load all users!')
        if (error instanceof Error && error.stack)
            logger.error(error.stack)
        return null
    }
}

const getUserQuery = buildQuery([...user, ...userProfile.slice(1), ...userAccount.slice(1)], [0, 1, 2], [joinUserProfile, joinUserAccount, 'User.userId = ?'])
async function getUserRaw(userId) {
    try {
        const query = (await db.query(getUserQuery, userId))
        if (query.results?.length)
            return query.results[0]
        logger.verbose(`User with id ${userId} does not exist`)
        return null
    } catch (error) {
        logger.error(`Something went wrong while attempting to query user ${userId}!`)
        if (error instanceof Error && error.stack)
            logger.error(error.stack)
        return null
    }
}

const getChatsQuery = buildQuery(chat, [3], [`${chat[1]} = ? OR ${chat[2]} = ?`])
async function getChatsRaw(userId) {
    try {
        const query = await db.query(getChatsQuery, userId, userId)
        return query.results
    } catch (error) {
        logger.error(`Something went wrong while attempting to load all chats of user ${userId}!`)
        if (error instanceof Error && error.stack)
            logger.error(error.stack)
        return null
    }
}

const getAllChatsQuery = `SELECT ${chat.join(', ')} FROM ${tables[3]}`
async function getAllChatsRaw() {
    try {
        const query = await db.query(getAllChatsQuery)
        return query.results
    } catch (error) {
        logger.error(`Something went wrong while attempting to load all chats!`)
        if (error instanceof Error && error.stack)
            logger.error(error.stack)
        return null
    }
}

const getMessagesQuery = buildQuery(message, [4], [`${message[4]} = ?`])
async function getMessagesRaw(chatId) {
    try {
        const query = await db.query(getMessagesQuery, chatId)
        return query.results
    } catch (error) {
        logger.error(`Something went wrong while attempting to load all messages of chat ${chatId}!`)
        if (error instanceof Error && error.stack)
            logger.error(error.stack)
        return null
    }
}

function updateProfileQuery(userName, userDescription, profilePicture) {
    let set = []
    if (userName) set.push(userProfile[1] + ' = ' + db.escape(userName))
    if (userDescription) set.push(userProfile[2] + ' = ' + db.escape(userDescription))
    if (profilePicture) set.push(userProfile[3] + ' = ' + db.escape(profilePicture))
    return `UPDATE ${tables[1]} SET ${set.join(', ')} WHERE ${userProfile[0]} = ?`
}
async function updateProfileRaw(profileId, userName, userDescription, profilePicture) {
    const transaction = await db.openTransaction()
    try {
        await transaction.exec(updateProfileQuery(userName, userDescription, profilePicture), profileId)
        await transaction.commit()
        return true
    } catch (error) {
        logger.error(`Something went wrong while attempting to update profile ${profileId}!`)
        if (error instanceof Error && error.stack)
            logger.error(error.stack)
        await transaction.rollback()
        return false
    }
}

const updatePasswordQuery = `UPDATE ${tables[2]} SET passwordHash = ? WHERE ${userAccount[0]} = ?`
async function updatePasswordRaw(accountId, password) {
    const transaction = await db.openTransaction()
    try {
        await transaction.exec(updatePasswordQuery, password, accountId)
        await transaction.commit()
        return true
    } catch (error) {
        logger.error(`Something went wrong while attempting to update password of account ${accountId}!`)
        if (error instanceof Error && error.stack)
            logger.error(error.stack)
        await transaction.rollback()
        return false
    }
}

const update2faQuery = `UPDATE ${tables[2]} SET twoFASecret = ? WHERE ${userAccount[0]} = ?`
async function update2faRaw(accountId, twoFASecret) {
    const transaction = await db.openTransaction()
    try {
        await transaction.exec(update2faQuery, twoFASecret, accountId)
        await transaction.commit()
        return true
    } catch (error) {
        logger.error(`Something went wrong while attempting to update 2fa secret of account ${accountId}!`)
        if (error instanceof Error && error.stack)
            logger.error(error.stack)
        await transaction.rollback()
        return false
    }
}

const sendMessageQuery = `INSERT INTO ${tables[4]}(${message.slice(1).join(', ')}) VALUES (?, ?, ?, ?)`
async function sendMessageRaw(chatId, senderId, data, sentOnAt) {
    const transaction = await db.openTransaction()
    try {
        let msgId = 0
        await transaction.query(res => msgId = res.insertId, sendMessageQuery, data, sentOnAt, senderId, chatId)
        await transaction.commit()
        return msgId
    } catch (error) {
        logger.error(`Something went wrong while attempting to send a message by ${senderId} into chat ${chatId}!`)
        if (error instanceof Error && error.stack)
            logger.error(error.stack)
        await transaction.rollback()
        return false
    }
}

const createChatQuery = `INSERT INTO ${tables[3]}(${chat.slice(1).join(', ')}) VALUES (?, ?)`
async function createChat(participant1, participant2) {
    const transaction = await db.openTransaction()
    try {
        let chatId = 0
        await transaction.query(res => chatId = res.insertId, createChatQuery, participant1, participant2)
        await transaction.commit()
        return chatId
    } catch (error) {
        logger.error(`Something went wrong while attempting to create a chat between users ${participant1} and ${participant2}!`)
        if (error instanceof Error && error.stack)
            logger.error(error.stack)
        await transaction.rollback()
        return false
    }
}

async function checkUser(userId) {
    const query = await db.query('SELECT * FROM User WHERE userId = ?', userId)
    if (query.results?.length)
        return true
    return false
}

const getChatQuery = buildQuery(['*'], [3], [`(${chat[1]} = ? AND ${chat[2]} = ?) OR (${chat[1]} = ? AND ${chat[2]} = ?)`])
async function getChat(participant1, participant2) {
    const query = await db.query(getChatQuery, participant1, participant2, participant2, participant1)
    return query.results?.[0]
}

async function getMessage(chatId, msgId) {
    const query = await db.query('SELECT * FROM Message WHERE msgId = ? AND chat = ?', msgId, chatId)
    return query.results?.[0]
}

async function getChatById(chatId) {
    const query = await db.query('SELECT * FROM Chat WHERE chatId = ?', chatId)
    return query.results?.[0]
}



// toStd functions

function userToStd(user, includeAccount) {
    if (!user)
        return null
    
    if (includeAccount) {
        return {
            userId: user.userId,
            account: { accountId: user.accountId, email: escape(user.email), twoFAEnabled: user.twoFAEnabled },
            profile: { profileId: user.profileId, userName: user.userName, userDescription: user.userDescription, profilePicture: user.profilePicture }
        }
    } else {
        return {
            userId: user.userId,
            profile: { profileId: user.profileId, userName: user.userName, userDescription: user.userDescription, profilePicture: user.profilePicture }
        }
    }
}

async function chatToStd(chat, userId, allChats) {
    if (!chat)
        return null
    
    if (chat.participant1 == userId)
        return { chatId: chat.chatId, participant1: userId, participant2: await getUser(chat.participant2) }
    if (chat.participant2 == userId)
        return { chatId: chat.chatId, participant1: userId, participant2: await getUser(chat.participant1) }
    if (allChats)
        return { chatId: chat.chatId, participant1: await getUser(chat.participant1), participant2: await getUser(chat.participant2) }
    logger.warn(`User ${userId} is not a member of chat ${chat.chatId}!`)
    return null
}

async function messageToStd(msg) {
    if (!msg)
        return null
    return { msgId: msg.msgId, chat: msg.chat, data: msg.data.toString(), author: msg.author, sentOnAt: msg.sentOnAt }
}


// util functions unrelated to database

async function hashPassword(password) {
    return await hashing.hash(password)
}

async function validatePassword(userId, password) {
    // TODO
}


/// Public definitions

async function getAllUsers(withAccount) {
    const users = await getAllUsersRaw()
    return users?.map(v => userToStd(v, withAccount))
}

async function getUser(userId, withAccount) {
    const user = await getUserRaw(userId)
    return userToStd(user, withAccount)
}

async function getChats(userId, allChats) {
    const chats = allChats ? await getAllChatsRaw() : await getChatsRaw(userId)
    if (!chats)
        return null
    let chatsStd = []
    for (const chat of chats)
        chatsStd.push(await chatToStd(chat, userId, allChats))
    return chatsStd
}

async function getMessages(chatId, userId) {
    const chat = await getChatById(chatId)
    if (!chat) {
        logger.warn(`Cannot get messages of chat ${chatId}: Chat does not exist!`)
        return 2
    }
    if (userId && (chat.participant1 != userId && chat.participant2 != userId)) {
        logger.warn(`Cannot get messages of chat ${chatId}: User ${userId} is not a participant of this chat!`)
        return 3
    }
    
    const msg = await getMessagesRaw(chatId)
    if (!msg)
        return 1

    let msgstd = []
    for (const m of msg)
        msgstd.push(await messageToStd(m))
    return msgstd
}

async function deleteUser(userId) {
    if (!await checkUser(userId)) {
        logger.warn(`Cannot delete user ${userId}: User does not exist!`)
        return 2
    }

    const transaction = await db.openTransaction()
    try {
        await transaction.exec('DELETE FROM User WHERE userId = ?', userId)
        await transaction.commit()
        return 0
    } catch (error) {
        logger.error(`Something went wrong while attempting to delete user ${userId}!`)
        if (error instanceof Error && error.stack)
            logger.error(error.stack)
        await transaction.rollback()
        return 1
    }
}

async function deleteChat(chatId, userId) {
    const chat = await getChatById(chatId)
    if (!chat) {
        logger.warn(`Cannot delete chat ${chatId}: Chat does not exist!`)
        return 2
    }
    if (userId && (chat.participant1 != userId && chat.participant2 != userId)) {
        logger.warn(`Cannot delete chat ${chatId}: User ${userId} is not a participant of this chat!`)
        return 3
    }

    const transaction = await db.openTransaction()
    try {
        await transaction.exec('DELETE FROM Chat WHERE chatId = ?', chatId)
        await transaction.commit()
        return 0
    } catch (error) {
        logger.error(`Something went wrong while attempting to delete chat ${chatId}!`)
        if (error instanceof Error && error.stack)
            logger.error(error.stack)
        await transaction.rollback()
        return 1
    }
}

async function deleteMessage(chatId, msgId, userId) {
    const msg = await getMessage(chatId, msgId)
    if (!msg) {
        logger.warn(`Cannot delete message ${msgId} of chat ${chatId}: Message does not exist!`)
        return 2
    }
    if (userId && msg.author != userId) {
        logger.warn(`Cannot delete message ${msgId} of chat ${chatId}: User ${userId} is not the author of the message!`)
        return 3
    }

    const transaction = await db.openTransaction()
    try {
        await transaction.exec('DELETE FROM Message WHERE msgId = ? AND chat = ?', msgId, chatId)
        await transaction.commit()
        return 0
    } catch (error) {
        logger.error(`Something went wrong while attempting to delete message ${msgId} of chat ${chatId}!`)
        if (error instanceof Error && error.stack)
            logger.error(error.stack)
        await transaction.rollback()
        return 1
    }
}

async function updateProfile(userId, userName, userDescription, profilePicture) {
    const user = await getUser(userId)
    if (!user) {
        logger.warn(`Cannot update profile of user ${userId}: User does not exist!`)
        return 2
    }
    const profileId = user.profile.profileId
    if (!(userName || userDescription || profilePicture)) {
        logger.warn(`Cannot update profile ${profileId} of user ${userId}: No parameters to update were passed!`)
        return 3
    }
    if (await updateProfileRaw(profileId, userName, userDescription, profilePicture))
        return 0
    return 1
}

async function updatePassword(userId, passwordHash) {
    const user = await getUser(userId, true)
    if (!user) {
        logger.warn(`Cannot update password of user ${userId}: User does not exist!`)
        return 2
    }
    const accountId = user.account.accountId
    if (!passwordHash) {
        logger.warn(`Cannot update password of user ${userId} with account ${accountId}: No new password was passed!`)
        return 3
    }
    if (await updatePasswordRaw(accountId, passwordHash))
        return 0
    return 1
}

async function update2fa(userId, twoFASecret) {
    const user = await getUser(userId, true)
    if (!user) {
        logger.warn(`Cannot update 2fa secret of user ${userId}: User does not exist!`)
        return 2
    }
    const accountId = user.account.accountId
    if (!twoFASecret) {
        logger.warn(`Cannot update 2fa secret of user ${userId} with account ${accountId}: No new 2fa secret was passed!`)
        return 3
    }
    if (await update2faRaw(accountId, passwordHash))
        return 0
    return 1
}

async function sendMessage(senderId, recipientId, data, sentOnAt) {
    let chat = (await getChat(senderId, recipientId))?.chatId
    if (!chat) {
        if (!await getUser(senderId)) {
            logger.warn(`Cannot send message from ${senderId} to ${recipientId}: Sender does not exist!`)
            return 2
        } else if (!await getUser(recipientId)) {
            logger.warn(`Cannot send message from ${senderId} to ${recipientId}: Recipient does not exist!`)
            return 3
        }

        chat = await createChat(senderId, recipientId)
        if (!chat) {
            logger.warn(`Cannot send message from ${senderId} to ${recipientId}: Failed to create chat!`)
            return 1
        }
    }

    if (!data || !sentOnAt) {
        logger.warn(`Cannot send message from ${senderId} to ${recipientId} into chat ${chat}: Missing parameters!`)
        return 4
    }

    if (await sendMessageRaw(chat, senderId, data, sentOnAt))
        return 0
    return 1
}


module.exports = {
    getAllUsers,
    getUser,
    getChats,
    getMessages,
    deleteUser,
    deleteChat,
    deleteMessage,
    updateProfile,
    updatePassword,
    update2fa,
    sendMessage
}
