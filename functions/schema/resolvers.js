const postService = require("./../services/PostService/PostService.js");
const userService = require("./../services/UserService/UserService.js");
const topicService = require("./../services/TopicService/TopicService.js");
const { AuthenticationError, UserInputError, ApolloError, ValidationError } = require("apollo-server-express");

const resolvers = {

  User: {

    savedPosts(parent, args, context, info) {
      if (context) {
        return userService.getAllSavedPostsByUser(parent.id);
      } else {
        throw new AuthenticationError("Unauthorized Request");
      }
    },

    followedTopics(parent, args, context, info) {
      if (context) {
        return userService.getAllFollowedTopicsByUser(parent.id);
      } else {
        throw new AuthenticationError("Unauthorized Request");
      }
    }

  },

  Post: {

    topic(parent, args, context, info) {
      return topicService.getTopicOfPost(parent.id);
    },

    likes(parent, args, context, info) {
      return postService.getAllLikesOnPost(parent.id);
    },

    likesCount(parent, args, context, info) {
      return postService.getLikesCountOnPost(parent.id);
    },

    savedCount(parent, args, context, info) {
      return userService.getSavedCountOnPost(parent.id);
    },
  },

  Topic: {

    posts(parent, args, context, info) {
      return postService.getAllPostsOnTopic(parent.name);
    },

    followers(parent, args, context, info) {
      return topicService.getAllFollowersOnTopic(parent.name);
    },

    followersCount(parent, args, context, info) {
      return topicService.getFollowersCountOnTopic(parent.name);
    }

  },

  Query: {

    getAllUsers(parent, args, context, info) {
      if (context) {
        return userService.getAllUsers();
      } else {
        throw new AuthenticationError("Unauthorized Request");
      }
    },

    getAllPosts(parent, args, context, info) {
      return postService.getAllPosts();
    },

    getAllDraftPosts(parent, args, context, info) {
      return postService.getAllDraftPosts();
    },

    getAllTopics(parent, args, context, info) {
      return topicService.getAllTopics();
    },

    checkIfUserExists(parent, args, context, info) {
      return userService.checkIfUserExists(args.puserId);
    },

    checkIfPostExists(parent, args, context, info) {
      return postService.checkIfPostExists(args.postId);
    },

    checkIfPostExistsForPostEditor(parent, args, context, info) {
      return postService.checkIfPostExistsForPostEditor(args.postId);
    },

    checkIfTopicExists(parent, args, context, info) {
      return topicService.checkIfTopicExists(args.topicName);
    },

    getUserFromId(parent, args, context, info) {
      return userService.getUserFromId(args.userId);
    },

    getPostFromId(parent, args, context, info) {
      return postService.getPostFromId(args.postId);
    },

    getPostFromIdForPostEditor(parent, args, context, info) {
      return postService.getPostFromIdForPostEditor(args.postId);
    },

    getTopicFromTopicName(parent, args, context, info) {
      return topicService.getTopicFromTopicName(args.topicName);
    },

    getAllPostsOnTopic(parent, args, context, info) {
      return postService.getAllPostsOnTopic(args.topicName);
    },

    getAllSavedPostsByUser(parent, args, context, info) {
      return userService.getAllSavedPostsByUser(args.userId);
    },

    getAllFollowedTopicsByUser(parent, args, context, info) {
      return userService.getAllFollowedTopicsByUser(args.userId);
    },

    getAllLikesOnPost(parent, args, context, info) {
      return postService.getAllLikesOnPost(args.postId);
    },

    checkIfTopicIsFollowedByUser(parent, args, context, info) {
      return userService.checkIfTopicIsFollowedByUser(args.userId, args.topicName);
    },

    checkIfPostIsLikedByUser(parent, args, context, info) {
      return postService.checkIfPostIsLikedByUser(args.userId, args.postId);
    },

    checkIfPostIsSavedByUser(parent, args, context, info) {
      return userService.checkIfPostIsSavedbyUser(args.userId, args.postId);
    },

    getAllFollowersOnTopic(parent, args, context, info) {
      return topicService.getAllFollowersOnTopic(args.topicName);
    },

    getFollowersCountOnTopic(parent, args, context, info) {
      return topicService.getFollowersCountOnTopic(args.topicName);
    },

    getLikesCountOnPost(parent, args, context, info) {
      return postService.getLikesCountOnPost(args.postId);
    },

    getSavedCountOnPost(parent, args, context, info) {
      return userService.getSavedCountOnPost(args.postId);
    },

    getDarkModeOfUser(parent, args, context, info) {
      return userService.getDarkModeOfUser(args.userId);
    },

  },

  Mutation: {

    createPost(parent, args, context, info) {
      if (context) {
        return postService.createPost(args.postInput);
      } else {
        throw new AuthenticationError("Unauthorized Request");
      }
    },

    editPost(parent, args, context, info) {
      if (context) {
        return postService.editPost(args.postId, args.postInput);
      } else {
        throw new AuthenticationError("Unauthorized Request");
      }
    },

    editPostTitle(parent, args, context, info) {
      if (context) {
        return postService.editPostTitle(args.postId, args.postTitle);
      } else {
        throw new AuthenticationError("Unauthorized Request");
      }
    },

    editPostCaption(parent, args, context, info) {
      if (context) {
        return postService.editPostCaption(args.postId, args.postCaption);
      } else {
        throw new AuthenticationError("Unauthorized Request");
      }
    },

    deletePost(parent, args, context, info) {
      if (context) {
        return postService.deletePost(args.postId);
      } else {
        throw new AuthenticationError("Unauthorized Request");
      }
    },

    likePost(parent, args, context, info) {
      if (context) {
        return postService.likePost(args.userId, args.postId);
      } else {
        throw new AuthenticationError("Unauthorized Request");
      }
    },

    dislikePost(parent, args, context, info) {
      if (context) {
        return postService.dislikePost(args.userId, args.postId);
      } else {
        throw new AuthenticationError("Unauthorized Request");
      }
    },

    savePost(parent, args, context, info) {
      if (context) {
        return userService.savePost(args.userId, args.postId);
      } else {
        throw new AuthenticationError("Unauthorized Request");
      }
    },

    unsavePost(parent, args, context, info) {
      if (context) {
        return userService.unsavePost(args.userId, args.postId);
      } else {
        throw new AuthenticationError("Unauthorized Request");
      }
    },

    createTopic(parent, args, context, info) {
      if (context) {
        return topicService.createTopic(args.topicInput);
      } else {
        throw new AuthenticationError("Unauthorized Request");
      }
    },

    followTopic(parent, args, context, info) {
      if (context) {
        return userService.followTopic(args.userId, args.topicName);
      } else {
        throw new AuthenticationError("Unauthorized Request");
      }
    },

    unfollowTopic(parent, args, context, info) {
      if (context) {
        return userService.unfollowTopic(args.userId, args.topicName);
      } else {
        throw new AuthenticationError("Unauthorized Request");
      }
    },

    enableDarkMode(parent, args, context, info) {
      if (context) {
        return userService.enableDarkMode(args.userId);
      } else {
        throw new AuthenticationError("Unauthorized Request");
      }
    },

    disableDarkMode(parent, args, context, info) {
      if (context) {
        return userService.disableDarkMode(args.userId);
      } else {
        throw new AuthenticationError("Unauthorized Request");
      }
    },

  }

};

module.exports = resolvers;