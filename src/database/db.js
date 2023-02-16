const { promisify } = require('util')
const mysql = require('mysql2');

/** @type {import('../logging/shared/loggerClass')} */
const logger = process.logger('Database')

// use app-db configuration
const dbLoginData = {
    port: process.env.appDatabasePort,
    host: process.env.sessionDatabaseHost,
    database: process.env.appDatabase,
    user: process.env.appDatabaseUser,
    password: process.env.appDatabasePassword,
    insecureAuth: true, // enable mysql_native_password
    flags: '-SECURE_CONNECTION', // same as above
};

/// Class definitions

/**
 * Transaction class, allows for querys to be passed to the connection. Can be commited or rolled back
 */
class Transaction {
    /** @type {mysql.Connection} The connection object used by this transaction */
    #connection;
    /** @type {boolean} Set to true once the transaction is either commited or rolled back */
    #completed = false;

    /**
     * Static function for creating a transaction object and starting the transaction
     * @param {mysql.Connection} connection A connection object with a valid connection to the database
     * @returns {Promise<Transaction>} A promise which contains the transaction object once preperation is complete
     */
    static async init(connection) {
        const transaction = new Transaction(connection);
        await promisify(transaction.#connection.beginTransaction).call(
            transaction.#connection
        );
        return transaction;
    }

    /**
     * The transaction constructor. Should not be called directly, use {@link init} instead.
     * @param {mysql.Connection} connection
     */
    constructor(connection) {
        this.#connection = connection;
    }

    /**
     * @callback ResultCallback
     * @param {any} results
     * @param {mysql.FieldInfo[]} fields
     */
    /**
     * Execute a sql statement, results are passed to {@link resultCallback}
     * @param {ResultCallback} resultCallback The callback function accepting the sql results
     * @param {string} transactionString The basic query string, will be passed to mysql. Placeholders (marked with ?) will be replaced with the escaped paramters
     * @param {...string} parameters Parameters to be escaped before being passed to sql.
     * @returns {Promise<Transaction>} itself
     */
    async query(resultCallback, transactionString, ...parameters) {
        if (this.#completed) throw new Error("Transaction is completed!");
        return new Promise((res, rej) => {
            this.#connection.query(
                transactionString,
                parameters,
                (err, sqlResults, sqlFields) => {
                    if (err) rej(err);
                    else {
                        resultCallback(sqlResults, sqlFields);
                        res(this);
                    }
                }
            );
        });
    }

    /**
     * Execute a sql statement, ignore results
     * @param {string} transactionString The basic query string, will be passed to mysql. Placeholders (marked with ?) will be replaced with the escaped paramters
     * @param {...string} parameters Parameters to be escaped before being passed to sql.
     * @returns {Promise<Transaction>} itself
     */
    async exec(transactionString, ...parameters) {
        return this.query(() => { }, transactionString, ...parameters);
    }

    /**
     * Commit the transaction to the database, completes this transaction
     */
    async commit() {
        if (this.#completed) throw new Error("Transaction is completed!");
        this.#completed = true;
        await promisify(this.#connection.commit).call(this.#connection);
        await this.#endConnection();
    }

    /**
     * Rollback transaction, completes this transaction
     */
    async rollback() {
        if (this.#completed) throw new Error("Transaction is completed!");
        this.#completed = true;
        await promisify(this.#connection.rollback).call(this.#connection);
        await this.#endConnection();
    }

    /**
     * Private function for closing the current connection
     */
    async #endConnection() {
        await promisify(this.#connection.end).call(this.#connection);
    }
}

/// Private (internal) definitions

/** @type {?mysql.Connection} The currently open connection to the SWA database */
let connection = null;

/**
 * Test if the current {@link connection} object can reach the database
 * @returns {Promise<Boolean>} true if the connection is valid, false otherwise
 */
async function testConnection() {
    // test if a connection object even exists
    if (!connection) return false;
    // ping database, if ping succeeds the connection is valid
    return new Promise((res) =>
        connection.ping((err) => res(err ? false : true))
    );
}

async function endConnection() {
    // if no connection object exists: resolve with failure
    if (!connection) return false;
    return new Promise((res, rej) => {
        connection.end((err) => {
            // remove reference to old connection object
            connection = null;
            // if no error occurred: resolve with success
            if (!err) res(true);
            // if the connection was already closed: resolve with failure
            else if (err.code === "PROTOCOL_ENQUEUE_AFTER_QUIT") res(false);
            // if an unknown error occurred: reject
            else rej(err);
        });
    });
}

/**
 * Create a new connection object, connect object to the database
 * @returns {Promise<mysql.Connection>} the new connection object
 */
async function createConnection() {
    // create a new connection object
    let con = mysql.createConnection(dbLoginData);
    // connect to database
    await promisify(con.connect).call(con);
    logger.debug('Connected to database, id: ' + con.threadId + ', host: ' + con.config.host);
    return con;
}

/**
 * Connect to the database, store connection object in {@link connection}
 * @returns {Promise<mysql.Connection>} the global connection object
 */
async function connect() {
    // if a valid connection exists: Return
    if (await testConnection()) return connection;
    // if any invalid connection still exists: Destroy connection
    if (connection) await endConnection();
    // create a new global connection object
    return (connection = await createConnection());
}

/// Public (exposed) functions

/**
 * @typedef {Object} QueryReturn
 * @property {any} results
 * @property {mysql.FieldInfo[]} fields
 */

/**
 * Executes a non-mutative sql query and returns the results.
 * @param {String} queryString The basic query string, will be passed to mysql. Placeholders (marked with ?) will be replaced with the escaped paramters
 * @param {...String} parameters Parameters to be escaped before being passed to sql.
 * @returns {Promise<QueryReturn>} The result of the query.
 */
async function query(queryString, ...parameters) {
    // receive confirmed valid connection object
    const con = await connect();
    // return a promise which will contain the query results once the query is completetd
    return new Promise((res, rej) => {
        con.query(queryString, parameters, (err, sqlResults, sqlFields) => {
            // reject on error
            if (err) rej(err);
            // resolve with sql query results
            else res({ results: sqlResults, fields: sqlFields });
        });
    });
}

/**
 * Opens a transaction which can accept an indefinite amount of sql commands before being either commited or rolled back.
 * @returns {Promise<Transaction>} The transaction object
 */
async function openTransaction() {
    // Create a new connection for the transaction
    const con = await createConnection();
    return Transaction.init(con);
}

/// Exports

module.exports = {
    query,
    openTransaction,
    Transaction,
    escape: mysql.escape
};
