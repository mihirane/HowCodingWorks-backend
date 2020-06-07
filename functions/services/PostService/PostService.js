const admin = require("firebase-admin");
const db = admin.firestore();
const { ApolloError } = require("apollo-server-express");
const topicService = require("./../TopicService/TopicService.js");
const FieldValue = require('firebase-admin').firestore.FieldValue;


async function getUserFromId(userId) {
    try {
        const user = await admin.auth().getUser(userId);

        if (user) {
            return {
                id: user.uid,
                displayName: user.displayName,
                email: user.email,
                emailVerified: user.emailVerified,
                photoURL: user.photoURL,
                phoneNumber: user.phoneNumber || null,
                creationTime: `${user.metadata.creationTime}`,
                lastSignInTime: `${user.metadata.lastSignInTime}`,
                disabled: user.disabled
            };
        }
        else {
            return new ApolloError(`User does not exist with id : ${userId}`, "INVALID_USER_ID");
        }
    }
    catch (error) {
        console.log(error);
        return new ApolloError("An unknown error occurred", "QUERY_FAILED");
    }
}


class PostService {

    static async getAllDraftPosts() {
        try {
            const allPosts = await db.collection("posts").where("published", "==", false).orderBy("creationTime", "desc").get();

            if (!allPosts.empty) {

                await allPosts.docs.forEach(async (doc, index) => {
                    if (!doc.data().published) {
                        allPosts.docs[index] = await {
                            id: doc.id,
                            title: doc.data().title,
                            caption: doc.data().caption,
                            description: doc.data().description,
                            creationTime: doc.data().creationTime._seconds * 1000,
                            published: doc.data().published,
                        };
                    }
                });

                return allPosts.docs;
            }
            else {
                return [];
            }
        }
        catch (error) {
            console.log(error);
            return new ApolloError("An unknown error occurred", "QUERY_FAILED");
        }
    }

    static async getAllPosts() {
        try {
            const allPosts = await db.collection("posts").where("published", "==", true).orderBy("creationTime", "desc").get();

            if (!allPosts.empty) {
                await allPosts.docs.forEach(async (doc, index) => {
                    allPosts.docs[index] = await {
                        id: doc.id,
                        title: doc.data().title,
                        caption: doc.data().caption,
                        description: doc.data().description,
                        creationTime: doc.data().creationTime._seconds * 1000,
                        published: doc.data().published,
                    };
                });

                return allPosts.docs;
            }
            else {
                return [];
            }
        }
        catch (error) {
            console.log(error);
            return new ApolloError("An unknown error occurred", "QUERY_FAILED");
        }
    }

    static async getAllPostsOnTopic(topicName) {
        try {
            const postsRef = await db.collection("posts")
                .where("published", "==", true)
                .where("topicName", "==", topicName)
                .orderBy("creationTime", "desc")
                .get();

            const posts = [];

            if (!postsRef.empty) {
                await Promise.all(postsRef.docs.map(async doc => {
                    if (doc.exists) {
                        const post = await {
                            id: doc.id,
                            title: doc.data().title,
                            caption: doc.data().caption,
                            description: doc.data().description,
                            creationTime: doc.data().creationTime._seconds * 1000,
                            published: doc.data().published
                        };

                        posts.push(post);
                    } else {
                        return new ApolloError(`Some error occurred while fetching posts of topic with name : ${topicName}`, "QUERY_FAILED");
                    }

                    return undefined;
                })).catch(error => {
                    console.log(error);
                });

                return posts;
            }
            else {
                const checkIfTopicExists = await topicService.checkIfTopicExists(topicName);

                if (!checkIfTopicExists) {
                    return new ApolloError(`Topic does not exist with name : ${topicName}`, "INVALID_TOPIC_NAME");
                }

                return [];
            }
        }
        catch (error) {
            console.log(error);
            return new ApolloError("An unknown error occurred", "QUERY_FAILED");
        }
    }

    static async checkIfPostExists(postId) {
        try {
            const postRef = await db.collection("posts").doc(postId).get();

            if (postRef.exists && postRef.data().published) {
                return true;
            }
            else {
                return false;
            }
        }
        catch (error) {
            console.log(error);
            return new ApolloError("An unknown error occurred", "QUERY_FAILED");
        }
    }

    static async checkIfPostExistsForPostEditor(postId) {
        try {
            const postRef = await db.collection("posts").doc(postId).get();

            if (postRef.exists) {
                return true;
            }
            else {
                return false;
            }
        }
        catch (error) {
            console.log(error);
            return new ApolloError("An unknown error occurred", "QUERY_FAILED");
        }
    }

    static async getPostFromId(postId) {
        try {
            const doc = await db.collection("posts").doc(postId).get();

            if (doc.exists && doc.data().published) {
                console.log(doc.data().creationTime._seconds)
                return {
                    id: doc.id,
                    title: doc.data().title,
                    caption: doc.data().caption,
                    description: doc.data().description,
                    creationTime: doc.data().creationTime._seconds * 1000,
                    published: doc.data().published,
                };
            }
            else {
                return new ApolloError(`Post does not exist with id : ${postId}`, "INVALID_POST_ID");
            }
        }
        catch (error) {
            console.log(error);
            return new ApolloError("An unknown error occurred", "QUERY_FAILED");
        }
    }

    static async getPostFromIdForPostEditor(postId) {
        try {
            const doc = await db.collection("posts").doc(postId).get();

            if (doc.exists) {
                return {
                    id: doc.id,
                    title: doc.data().title,
                    caption: doc.data().caption,
                    description: doc.data().description,
                    creationTime: doc.data().creationTime._seconds * 1000,
                    published: doc.data().published,
                };
            }
            else {
                return new ApolloError(`Post does not exists with id : ${postId}`, "INVALID_POST_ID");
            }
        }
        catch (error) {
            console.log(error);
            return new ApolloError("An unknown error occurred", "QUERY_FAILED");
        }
    }

    static async createPost(postInput) {
        try {
            const postRef = await db.collection("posts").add({
                title: postInput.title,
                caption: postInput.caption,
                description: postInput.description,
                topicName: postInput.topicName,
                published: postInput.published,
                creationTime: FieldValue.serverTimestamp(),
                likes: []
            });
            if (postRef.id) {
                return {
                    id: postRef.id,
                    title: postInput.title,
                    caption: postInput.caption,
                    description: postInput.description,
                    creationTime: FieldValue.serverTimestamp()._seconds * 1000,
                    published: postInput.published,
                };
            }
            else {
                return new ApolloError("Some error occurred while creating post", "POST_MUTATION_FAILED");
            }
        }
        catch (error) {
            console.log(error);
            return new ApolloError("An unknown error occurred", "POST_MUTATION_FAILED");
        }
    }

    static async editPost(postId, postInput) {
        try {
            const doc = await db.collection("posts").doc(postId).update({
                title: postInput.title,
                caption: postInput.caption,
                description: postInput.description,
                topicName: postInput.topicName,
                published: postInput.published
            });
            if (doc) {
                return {
                    id: postId,
                    title: postInput.title,
                    caption: postInput.caption,
                    description: postInput.description,
                    published: postInput.published,
                };
            }
            else {
                const checkIfPostExists = await this.checkIfPostExists(postId);

                if (checkIfPostExists) {
                    return new ApolloError(`Post does not exist with id : ${postId}`, "INVALID_POST_ID");
                }

                return new ApolloError("Some error occurred while editing post", "POST_MUTATION_FAILED");
            }
        }
        catch (error) {
            console.log(error);
            return new ApolloError("An unknown error occurred", "POST_MUTATION_FAILED");
        }
    }

    static async deletePost(postId) {
        try {
            const value = await db.collection("posts").doc(postId).delete();

            if (value) {
                return true;
            }
            else {
                const checkIfPostExists = await this.checkIfPostExists(postId);

                if (checkIfPostExists) {
                    return new ApolloError(`Post does not exist with id : ${postId}`, "INVALID_POST_ID");
                }

                return new ApolloError("Some error occurred while deleting post", "POST_MUTATION_FAILED");
            }
        }
        catch (error) {
            console.log(error);
            return new ApolloError("An unknown error occurred", "POST_MUTATION_FAILED");
        }
    }

    static async editPostTitle(postId, postTitle) {
        try {
            const postRef = await db.collection("posts").doc(postId).update({
                title: postTitle
            });

            if (postRef) {
                return postTitle;
            }
            else {
                const checkIfPostExists = await this.checkIfPostExists(postId);

                if (checkIfPostExists) {
                    return new ApolloError(`Post does not exist with id : ${postId}`, "INVALID_POST_ID");
                }

                return new ApolloError("Some error occurred while deleting post", "POST_MUTATION_FAILED");
            }
        }
        catch (error) {
            console.log(error);
            return new ApolloError("An unknown error occurred", "POST_MUTATION_FAILED");
        }
    }

    static async editPostCaption(postId, postCaption) {
        try {
            const postRef = await db.collection("posts").doc(postId).update({
                caption: postCaption
            });
            if (postRef) {
                return postCaption;
            }
            else {
                const checkIfPostExists = await this.checkIfPostExists(postId);

                if (checkIfPostExists) {
                    return new ApolloError(`Post does not exist with id : ${postId}`, "INVALID_POST_ID");
                }

                return new ApolloError("Some error occurred while deleting post", "POST_MUTATION_FAILED");
            }
        }
        catch (error) {
            console.log(error);
            return new ApolloError("An unknown error occurred", "POST_MUTATION_FAILED");
        }
    }

    static async checkIfPostIsLikedByUser(userId, postId) {
        try {
            const userRef = await db.collection("users").doc(userId).get();

            if (userRef.exists) {
                const postRef = await db.collection("posts").doc(postId).get();

                if (postRef.exists) {
                    if (postRef.data().likes.includes(userId)) {
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    return new ApolloError(`Post does not exist with id : ${postId}`, "INVALID_POST_ID");
                }
            } else {
                return new ApolloError(`User does not exist with id : ${userId}`, "INVALID_USER_ID");
            }
        }
        catch (error) {
            console.log(error);
            return new ApolloError("An unknown error occurred", "POST_MUTATION_FAILED");
        }
    }

    static async likePost(userId, postId) {
        try {
            const userRef = await db.collection("users").doc(userId).get();

            if (userRef.exists) {
                const checkIfPostExists = await this.checkIfPostExists(postId);

                if (checkIfPostExists) {
                    const checkIfPostIsLikedByUser = await this.checkIfPostIsLikedByUser(userId, postId);

                    if (!checkIfPostIsLikedByUser) {
                        const likeRef = await db.collection("posts").doc(postId).update({
                            likes: admin.firestore.FieldValue.arrayUnion(userId)
                        });

                        if (likeRef) {
                            return this.getPostFromId(postId);
                        }
                        else {
                            return new ApolloError("Some error occurred while liking the post", "POST_MUTATION_FAILED");
                        }
                    } else {
                        return new ApolloError(`User with id : ${userId} has already liked post with id : ${postId}`, "INVALID_OPERTION");
                    }
                } else {
                    return new ApolloError(`Post does not exist with id : ${postId}`, "INVALID_POST_ID");
                }
            } else {
                return new ApolloError(`User does not exist with id : ${userId}`, "INVALID_USER_ID");
            }
        }
        catch (error) {
            console.log(error);
            return new ApolloError("An unknown error occurred", "POST_MUTATION_FAILED");
        }
    }

    static async dislikePost(userId, postId) {
        try {
            const userRef = await db.collection("users").doc(userId).get();

            if (userRef.exists) {
                const checkIfPostExists = await this.checkIfPostExists(postId);

                if (checkIfPostExists) {

                    const checkIfPostIsLikedByUser = await this.checkIfPostIsLikedByUser(userId, postId);

                    if (checkIfPostIsLikedByUser) {
                        const dislikeRef = await db.collection("posts").doc(postId).update({
                            likes: admin.firestore.FieldValue.arrayRemove(userId)
                        });

                        if (dislikeRef) {
                            return this.getPostFromId(postId);
                        }
                        else {
                            return new ApolloError("Some error occurred while liking the post", "POST_MUTATION_FAILED");
                        }
                    } else {
                        return new ApolloError(`User with id : ${userId} has already liked post with id : ${postId}`, "INVALID_OPERTION");
                    }
                } else {
                    return new ApolloError(`Post does not exist with id : ${postId}`, "INVALID_POST_ID");
                }
            } else {
                return new ApolloError(`User does not exist with id : ${userId}`, "INVALID_USER_ID");
            }
        }
        catch (error) {
            console.log(error);
            return new ApolloError("An unknown error occurred", "POST_MUTATION_FAILED");
        }
    }


    static async getAllLikesOnPost(postId) {
        try {
            const postRef = await db.collection("posts").doc(postId).get();
            const allUsers = [];

            if (postRef.exists) {
                await Promise.all(postRef.data().likes.map(async (userId) => {
                    if (userId !== null) {
                        const user = await getUserFromId(userId);
                        allUsers.push(user);
                    } else {
                        return new ApolloError("Some error occurred while fetching likes on post", "QUERY_FAILED");
                    }

                    return undefined;
                })).catch(error => {
                    console.log(error);
                    return new ApolloError("An unknown error occurred", "QUERY_FAILED");
                });

                return allUsers;
            } else {
                return new ApolloError(`Post does not exist with id : ${postId}`, "INVALID_POST_ID");
            }
        }
        catch (error) {
            console.log(error);
            return new ApolloError("An unknown error occurred", "QUERY_FAILED");
        }
    }

    static async getLikesCountOnPost(postId) {
        try {
            const postRef = await db.collection("posts").doc(postId).get();

            if (postRef.exists) {
                const likesCount = await postRef.data().likes.length;
                return likesCount;
            } else {
                return new ApolloError(`Post does not exist with id : ${postId}`, "INVALID_POST_ID");
            }
        }
        catch (error) {
            console.log(error);
            return new ApolloError("An unknown error occurred", "QUERY_FAILED");
        }
    }

}

module.exports = PostService;