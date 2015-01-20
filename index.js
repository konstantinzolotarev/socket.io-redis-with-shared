
/**
 * Module dependencies.
 */

var uid2 = require('uid2');
var redis = require('redis').createClient;
var msgpack = require('msgpack-js');
var Adapter = require('socket.io-adapter');
var Emitter = require('events').EventEmitter;
var debug = require('debug')('socket.io-redis');

var Shared = require('./lib/shared');


var GAMEARRAY_KEY = 'gameArray:data';

/**
 * Module exports.
 */

module.exports = adapter;

/**
 * Returns a redis Adapter class.
 *
 * @param {String} optional, redis uri
 * @return {RedisAdapter} adapter
 * @api public
 */

function adapter(uri, opts){
    opts = opts || {};

    // handle options only
    if ('object' == typeof uri) {
        opts = uri;
        uri = null;
    }

    // handle uri string
    if (uri) {
        uri = uri.split(':');
        opts.host = uri[0];
        opts.port = uri[1];
    }

    // opts
    var socket = opts.socket;
    var host = opts.host || '127.0.0.1';
    var port = Number(opts.port || 6379);
    var pub = opts.pubClient;
    var sub = opts.subClient;
    var prefix = opts.key || 'socket.io';

    // init clients if needed
    if (!pub) pub = socket ? redis(socket) : redis(port, host);
    if (!sub) sub = socket
        ? redis(socket, { detect_buffers: true })
        : redis(port, host, {detect_buffers: true});


    // this server's key
    var uid = uid2(6);
    var key = prefix + '#' + uid;

    /**
     * Adapter constructor.
     *
     * @param {String} namespace name
     * @api public
     */

    function Redis(nsp){
        Adapter.call(this, nsp);

        var self = this;
        sub.psubscribe(prefix + '#*', function(err){
            if (err) self.emit('error', err);
        });
        sub.on('pmessage', this.onmessage.bind(this));

        self.shared = Shared;
    }

    /**
     * Inherits from `Adapter`.
     */

    Redis.prototype.__proto__ = Adapter.prototype;

    /**
     * Will store shared into redis
     *
     * @param {function} cb callback
     */
    Redis.prototype.setShared = function(cb) {
        var self = this;
        try {
            pub.set(GAMEARRAY_KEY, JSON.stringify(this.shared.data || {}), function(err) {
                if(err) return cb(err);
                self.sync();
                cb();
            });
        } catch(e) {
            cb(e);
        }
    };

    /**
     * Will fetch shared from redis
     *
     * @param {function} cb callback
     */
    Redis.prototype.getShared = function(cb) {
        var self = this;
        pub.get(GAMEARRAY_KEY, function(err, data) {
            if (err) return cb(err);
            try {
                self.shared.data = JSON.parse(data || '{}');
                cb();
            } catch(e) {
                cb(e);
            }
        });
    };

    /**
     * Will sync all objects between all instances
     */
    Redis.prototype.sync = function() {
        var packet = {
            nsp: this.nsp.name,
            data: this.shared
        };
        pub.publish(key+'#shared', msgpack.encode([packet, {shared: true}]));
    };

    /**
     * Called with a subscription message
     *
     * @api private
     */

    Redis.prototype.onmessage = function(pattern, channel, msg){
        var pieces = channel.split('#');
        if (uid == pieces.pop()) return debug('ignore same uid');
        var args = msgpack.decode(msg);

        if (args[0] && args[0].nsp === undefined) {
            args[0].nsp = '/';
        }

        if (!args[0] || args[0].nsp != this.nsp.name) {
            return debug('ignore different namespace');
        }

        if (args[1] && args[1].shared) {
            //sync shared !
            this.getShared();
            return;
        }
        args.push(true);

        this.broadcast.apply(this, args);
    };

    /**
     * Broadcasts a packet.
     *
     * @param {Object} packet to emit
     * @param {Object} options
     * @param {Boolean} whether the packet came from another node
     * @api public
     */

    Redis.prototype.broadcast = function(packet, opts, remote){
        Adapter.prototype.broadcast.call(this, packet, opts);
        if (!remote) pub.publish(key, msgpack.encode([packet, opts]));
    };

    return Redis;

}
