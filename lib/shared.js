'use strict';

var _ = require('lodash');

/**
 * Shated data represent
 *
 * @type {*}
 */
module.exports = {

    /**
     * Data that should be defined
     */
    data: {},

    /**
     * Get full game data object
     * @returns {*}
     */
    getGameArray: function() {
        return this.data;
    },

    /**
     * Add new user to the game
     *
     * @throws Error if no game exist
     * @param {string|number} gameId
     * @param {string|number} userId
     * @param {Object} userObj
     */
    addUser: function(gameId, userId, userObj) {
        if (!this.data[gameId]) {
            throw new Error('No game exist with id: '+gameId);
        }
        if (!this.data[gameId].userData) this.data[gameId].userData = {};
        this.data[gameId].userData[userId] = userObj;
    },

    /**
     * Remove user from game
     *
     * @param {string|number} gameId
     * @param {string|number} userId
     */
    removeUser: function(gameId, userId) {
        if (!this.data[gameId] || !this.data[gameId].userData || !this.data[gameId].userData[userId]) return;
        delete this.data[gameId].userData[userId];
    },

    /**
     * Add new game object
     *
     * @param {string|number} gameId
     * @param {Object} gameObj
     */
    addGame: function(gameId, gameObj) {
        this.data[gameId] = gameObj;
    },

    /**
     * Remove game
     *
     * @param {string|number} gameId
     */
    removeGame: function(gameId) {
        if (!this.data[gameId]) return;
        delete this.data[gameId];
    },

    /**
     * Set value to game object
     *
     * @throws Error if no game exist
     * @param {string|number} gameId
     * @param {string} propName
     * @param {*} propValue
     */
    setGameProp: function(gameId, propName, propValue) {
        if (!this.data[gameId]) {
            throw new Error('No game exist with id: '+gameId);
        }
        this.data[gameId][propName.toString()] = propValue;
    },

    /**
     * Add a new chat object to game
     *
     * @throws Error if no game exist
     * @param {string|number} gameId
     * @param {Object} chatObj
     */
    addChat: function(gameId, chatObj) {
        if (!this.data[gameId]) {
            throw new Error('No game exist with id: '+gameId);
        }
        if (!this.data[gameId].chatData || !_.isArray(this.data[gameId].chatData)) {
            this.data[gameId].chatData = [];
        }
        return this.data[gameId].chatData.push(chatObj);
    }

};