const _ = require('underscore');
const Promise = require('bluebird');
const db = require('../lib/db/mongo');

/**
 * Add some other fields to the story. For now upvote and downvotes.
 * @param story {Object} - the story object to enrichStory
 * @return {Object} - the enriched story
 */
function enrichStory(story) {
    story.upvote = 0;
    story.downvote = 0;

    return story;
}

module.exports = {
    /**
     * Make sure the story have useful info. Check url and og_image_url. Filed
     * types are checked by the Swagger validator - don't need to check those.
     * @param stories {Array} - the array of stories to be checked
     * @return {Promise}
     */
    validateStories(stories) {
        // TODO: check to see if url and og_image_url (if exists) have content,
        // if not then set those fields to null
        return new Promise.resolve(null);
    },

    /**
     * Insert Stories into the database
     * @param stories {Array} - stories to be insertedCount
     * @return {Promise}
     */
    insertStories(stories) {
        let richStories = _.map(stories, enrichStory);
        return db.getCollection().insertMany(richStories)
            .then(function(data) {
                return Promise.resolve(data.insertedCount);
            });
    },

    /**
     * Fetches a story by its id.
     * @param storyId {String} - the string id
     * @return return {Promise}
     */
    fetchById(storyId) {
        let objId = db.getObjectId(storyId);

        if (!objId) {
            return Promise.reject('id string is not valid');
        }

        return db.getCollection().find({_id: objId}).toArray()
            .then(function(fetchedStory) {
                if (_.isEmpty(fetchedStory)) {
                    return Promise.reject('id is not found');
                }

                return Promise.resolve(fetchedStory[0]);
            });
    },

    /**
     * Fetches all stories in the story collection.
     * @param filter {Object} - kv on what documents to show
     * @param options {Object} - kv on find options ex. sort, limit
     * @return {Promise}
     */
    fetchAll(filter, options) {
        return db.getCollection().find(filter, options).toArray()
            .then(function(stories) {
                return Promise.resolve(stories);
            });
    },

    /**
     * Upvote or Downvote on a story.
     * @param storyId {String} - the story's string id
     * @param upvote {Boolean} - if true then upvote this story
     * @return {Promise}
     */
    voteOnStory(storyId, upvote) {
        let objectId = db.getObjectId(storyId);
        let voteObj = {
            $inc: null
        };

        if (!objectId) {
            return Promise.reject('story id is not a valid id string');
        }

        if (upvote) {
            voteObj.$inc = {
                upvote: 1
            };
        }
        else {
            voteObj.$inc = {
                downvote: 1
            };
        }

        return db.getCollection().update({_id: objectId}, voteObj)
            .then(function() {
                return Promise.resolve(updatedStory => {
                    if (upvote) {
                        updatedStory.upvote += 1;
                    }
                    else {
                        updatedStory.downvote += 1;
                    }

                    return updatedStory;
                });
            });
    }
};
