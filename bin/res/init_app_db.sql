/* 
 * ###############################
 * #    SecureWebApp DATABASE    #
 * ###############################
 */

/* drop database */
drop database if exists SWA;
/* create database */
create database SWA;
/* select database */
use SWA;

/* drop tables */
/* unecessary, database was just created above after all */
drop table if exists UserProfile;
drop table if exists UserAccount;
drop table if exists User;
drop table if exists Chat;
drop table if exists Message;


/* create user_profiles table */
create table UserProfile (
    profileId integer primary key auto_increment,
    userName varchar(256) null,
    /* userHandle integer null, */ /* removed user handle due to time constraints */
    userDescription varchar(4096) null,
    profilePicture mediumblob null,
    unique (userName/*, userHandle*/)
);

/* create user_accounts table */
create table UserAccount (
    accountId integer primary key auto_increment,
    passwordHash varbinary(1024) null, /* varbinary uses actual length of the data + 2 bytes for storage */
    email varchar(256) unique,
    twoFAEnabled boolean null,
    twoFASecret varbinary(1024) null
);

/* create user table */
create table User (
    userId integer primary key auto_increment,
    profileId integer,
    accountId integer,
    constraint fk_profile_id
        foreign key (profileId) references UserProfile(profileId)
            on delete cascade,
    constraint fk_account_id
        foreign key (accountId) references UserAccount(accountId)
            on delete cascade
);

/* create chats table */
create table Chat (
    chatId integer primary key auto_increment,
    participant1 integer null,
    participant2 integer null,
    unique (participant1, participant2),
    constraint fk_participant_1
        foreign key (participant1) references User(userId)
            on delete cascade,
    constraint fk_participant_2
        foreign key (participant2) references User(userId)
            on delete cascade
);

/* create messages table */
create table Message (
    msgId integer primary key auto_increment,
    data varbinary(4096) null,
    sentOnAt datetime null,
    author integer null,
    chat integer,
    constraint fk_user_id
        foreign key (author) references User(userId)
            on delete cascade,
    constraint fk_chat_id
        foreign key (chat) references Chat(chatId)
            on delete cascade
);


/* drop user if exists 'SWAUser'@'mysql-db';
create user 'SWAUser'@'mysql-db' IDENTIFIED WITH mysql_native_password BY '$1'; */
grant all on SWA.* to 'SWAUser'@'mysql-db';
flush privileges;

/* drop database if exists ExpressSession;
create database ExpressSession;

drop user if exists 'ExpressSessionUser'@'mysql-db';
create user 'ExpressSessionUser'@'mysql-db' IDENTIFIED WITH mysql_native_password BY '$2';
grant all on ExpressSession.* to 'ExpressSessionUser'@'mysql-db';
flush privileges; */

/* create messages groups */
/* create messages group_members */
/* create messages groups_invitations */
/* create messages groups */
/* create messages group_messages */
/* create messages groups_message_reports */
/* drop table group cascade constraints; */
/* drop table group_member cascade constraints; */
/* drop table group_invitation cascade constraints; */
/* drop table group_text_message cascade constraints; */
/* drop table group_message_report cascade constraints; */
