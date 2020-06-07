const typeDefs = `

type Post{
  id: String!
  title: String!
  caption: String!
  description: String!
  topic: Topic!
  creationTime: String!
  published: Boolean!
  likes: [User!]
  likesCount: Int!
  savedCount: Int!
}

type Topic{
  name: String!
  thumbnailLink: String!
  description: String!
  creationTime: String!
  posts: [Post!]
  followers: [User!]
  followersCount: Int!
}

type User{
  id: String!
  email: String!
  emailVerified: Boolean!
  displayName: String!
  photoURL: String!
  phoneNumber: Int
  creationTime: String!
  lastSignInTime: String!
  disabled: Boolean!
  savedPosts: [Post!]!
  followedTopics: [Topic!]
}

type Query{
  getAllUsers: [User!]
  getAllPosts: [Post!]
  getAllDraftPosts: [Post!]
  getAllTopics: [Topic!]
  checkIfUserExists(userId: String!): Boolean!
  checkIfPostExists(postId: String!): Boolean!
  checkIfPostExistsForPostEditor(postId: String!): Boolean!
  checkIfTopicExists(topicName: String!): Boolean!
  getUserFromId(userId: String!): User
  getPostFromId(postId: String!): Post
  getPostFromIdForPostEditor(postId: String!): Post
  getTopicFromTopicName(topicName: String!): Topic
  getAllPostsOnTopic(topicName: String!): [Post!]
  getAllSavedPostsByUser(userId: String!): [Post!]
  getAllFollowedTopicsByUser(userId: String!): [Topic!]
  checkIfTopicIsFollowedByUser(userId: String!, topicName: String!): Boolean!
  checkIfPostIsLikedByUser(userId: String!, postId: String!): Boolean!
  checkIfPostIsSavedByUser(userId: String!, postId: String!): Boolean!
  getAllLikesOnPost(postId: String!): [User!]
  getAllFollowersOnTopic(topicName: String!): [User!]
  getFollowersCountOnTopic(topicName: String!): Int!
  getLikesCountOnPost(postId: String!): Int!
  getSavedCountOnPost(postId: String!): Int!
  getDarkModeOfUser(userId: String!): Boolean!
}

type Mutation{
  createPost(postInput: PostInput!): Post!
  deletePost(postId: String!): Boolean!
  editPost(postId: String!, postInput: PostInput!): Post!
  editPostTitle(postId: String!, postTitle: String!): String!
  editPostCaption(postId: String!, postCaption: String!): String!
  likePost(userId: String!, postId: String!): Post!
  dislikePost(userId: String!, postId: String!): Post!
  savePost(userId: String!, postId: String!): Post!
  unsavePost(userId: String!, postId: String!): Post!
  createTopic(topicInput: TopicInput!): Topic!
  followTopic(userId: String!, topicName: String!): Topic!
  unfollowTopic(userId: String!, topicName: String!): Topic!
  enableDarkMode(userId: String!): Boolean!
  disableDarkMode(userId: String!): Boolean!
}

input PostInput{
  title: String!
  caption: String!
  description: String!
  topicName: String!
  published: Boolean!
}

input TopicInput{
  name: String!
  thumbnailLink: String!
  description: String!
}

input UserInput{
  email: String!
  firstName: String!
  lastName: String!
}

`;

module.exports = typeDefs;