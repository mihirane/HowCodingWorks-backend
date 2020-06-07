const admin = require('firebase-admin');
const db = admin.firestore();
const topicService = require("./../TopicService/TopicService.js");
const postService = require("./../PostService/PostService.js");
const { ApolloError } = require("apollo-server-express");

async function listAllUsers(nextPageToken, allUsers) {
    try {
        const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);

        listUsersResult.users.forEach(async (user) => {
            await allUsers.push({
                id: user.uid,
                displayName: user.displayName,
                email: user.email,
                emailVerified: user.emailVerified,
                photoURL: user.photoURL,
                phoneNumber: user.phoneNumber || null,
                creationTime: `${user.metadata.creationTime}`,
                lastSignInTime: `${user.metadata.lastSignInTime}`,
                disabled: user.disabled
            });
        });
        if (listUsersResult.pageToken) {
            await listAllUsers(listUsersResult.pageToken, allUsers);
        }
        else {
            return allUsers;
        }

        return undefined;
    }
    catch (error) {
        console.log(error);
        return new ApolloError("An unknown error occurred", "QUERY_FAILED");
    }
}


class UserService {

    static getAllUsers() {
        return listAllUsers(undefined, []);
    }

    static async checkIfUserExists(userId) {
        try {
            const user = await admin.auth().getUser(userId);

            if (user) {
                return true;
            }
            else {
                return false;
            }
        }
        catch (error) {
            console.log(error);
            return false;
        }
    }

    static async getUserFromId(userId) {
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

    static async checkIfPostIsSavedbyUser(userId, postId) {
        try {
            const doc = await db.collection("users").doc(userId).get();

            if (doc.exists) {
                if (await doc.data().savedPosts.includes(postId)) {
                    return true;
                } else {
                    return false;
                }
            } else {
                const checkIfUserExists = await this.checkIfUserExists(userId);

                if (checkIfUserExists) {
                    const checkIfPostExists = await postService.checkIfPostExists(postId);

                    if (!checkIfPostExists) {
                        return new ApolloError(`Post does not exist with id : ${postId}`, "INVALID_POST_ID");
                    }

                } else {
                    return new ApolloError(`User does not exist with id : ${userId}`, "INVALID_USER_ID");
                }

                return false;
            }
        }
        catch (error) {
            console.log(error);
            return new ApolloError("An unknown error occurred");
        }
    }

    static async savePost(userId, postId) {
        try {
            const checkIfUserExists = await this.checkIfUserExists(userId);

            if (checkIfUserExists) {
                const checkIfPostExists = await postService.getPostFromId(postId);

                if (checkIfPostExists) {
                    const checkIfPostIsSavedbyUser = await this.checkIfPostIsSavedbyUser(userId, postId);

                    if (!checkIfPostIsSavedbyUser) {
                        const doc = await db.collection("users").doc(userId).update({
                            savedPosts: admin.firestore.FieldValue.arrayUnion(postId)
                        });

                        if (doc && doc !== null) {
                            return await postService.getPostFromId(postId);
                        }
                        else {
                            return new ApolloError("Some error occurred while saving post", "USER_MUTATION_FAILED");
                        }
                    } else {
                        return new ApolloError(`Post with id : ${postId} is already saved by user with id : ${userId}`, "INVALID_OPERATION");
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
            return new ApolloError("An unknown error occurred", "USER_MUTATION_FAILED");
        }
    }

    static async unsavePost(userId, postId) {
        try {
            const checkIfUserExists = await this.checkIfUserExists(userId);

            if (checkIfUserExists) {
                const checkIfPostExists = await postService.getPostFromId(postId);

                if (checkIfPostExists) {
                    const checkIfPostIsSavedbyUser = await this.checkIfPostIsSavedbyUser(userId, postId);

                    if (checkIfPostIsSavedbyUser) {
                        const doc = await db.collection("users").doc(userId).update({
                            savedPosts: admin.firestore.FieldValue.arrayRemove(postId)
                        });

                        if (doc && doc !== null) {
                            return await postService.getPostFromId(postId);
                        }
                        else {
                            return new ApolloError("Some error occurred while saving post", "USER_MUTATION_FAILED");
                        }
                    } else {
                        return new ApolloError(`Post with id : ${postId} is not saved by user with id : ${userId}`, "INVALID_OPERATION");
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
            return new ApolloError("An unknown error occurred", "USER_MUTATION_FAILED");
        }
    }

    static async checkIfTopicIsFollowedByUser(userId, topicName) {
        try {
            const userRef = await db.collection("users").doc(userId).get();

            if (userRef.exists) {
                if (await userRef.data().followedTopics.includes(topicName)) {
                    return true;
                } else {
                    return false;
                }

            } else {
                const checkIfUserExists = await this.checkIfUserExists(userId);

                if (checkIfUserExists) {
                    const checkIfTopicExists = await topicService.checkIfTopicExists(topicName);

                    if (!checkIfTopicExists) {
                        return new ApolloError(`Topic does not exist with name : ${topicName}`, "INVALID_TOPIC_NAME");
                    }
                } else {
                    return new ApolloError(`User does not exist with id : ${userId}`, "INVALID_USER_ID");
                }

                return false;
            }
        } catch (error) {
            console.log(error);
            return new ApolloError("An unknown error occurred", "QUERY_FAILED");
        }
    }

    static async followTopic(userId, topicName) {
        try {
            const checkIfUserExists = await this.checkIfUserExists(userId);

            if (checkIfUserExists) {
                const checkIfTopicExists = await topicService.getTopicFromTopicName(topicName);

                if (checkIfTopicExists) {
                    const checkIfTopicIsFollowedByUser = await this.checkIfTopicIsFollowedByUser(userId, topicName);

                    if (!checkIfTopicIsFollowedByUser) {
                        const topicNameRef = await db.collection("users").doc(userId).update({
                            followedTopics: admin.firestore.FieldValue.arrayUnion(topicName)
                        });

                        if (topicNameRef) {
                            return await topicService.getTopicFromTopicName(topicName);
                        } else {
                            return new ApolloError("Some error occurred while following topic", "USER_MUTATION_FAILED");
                        }
                    } else {
                        return new ApolloError(`User with id : ${userId} is already following topic with name : ${topicName}`, "INVALID_OPERATION");
                    }
                } else {
                    return new ApolloError(`Topic does not exist with name : ${topicName}`, "INVALID_TOPIC_NAME");
                }
            } else {
                return new ApolloError(`User does not exist with id : ${userId}`, "INVALID_USER_ID");
            }
        }
        catch (error) {
            console.log(error);
            return new ApolloError("An unknown error occurred", "USER_MUTATION_FAILED");
        }
    }

    static async unfollowTopic(userId, topicName) {
        try {
            const checkIfUserExists = await this.checkIfUserExists(userId);

            if (checkIfUserExists) {
                const checkIfTopicExists = await topicService.getTopicFromTopicName(topicName);

                if (checkIfTopicExists) {
                    const checkIfTopicIsFollowedByUser = await this.checkIfTopicIsFollowedByUser(userId, topicName);

                    if (checkIfTopicIsFollowedByUser) {
                        const topicNameRef = await db.collection("users").doc(userId).update({
                            followedTopics: admin.firestore.FieldValue.arrayRemove(topicName)
                        });

                        if (topicNameRef) {
                            return await topicService.getTopicFromTopicName(topicName);
                        } else {
                            return new ApolloError("Some error occurred while unfollowing topic", "USER_MUTATION_FAILED");
                        }
                    } else {
                        return new ApolloError(`User with id : ${userId} is not following topic with name : ${topicName}`, "INVALID_OPERATION");
                    }
                } else {
                    return new ApolloError(`Topic does not exist with name : ${topicName}`, "INVALID_TOPIC_NAME");
                }
            } else {
                return new ApolloError(`User does not exist with id : ${userId}`, "INVALID_USER_ID");
            }
        }
        catch (error) {
            console.log(error);
            return new ApolloError("An unknown error occurred", "USER_MUTATION_FAILED");
        }
    }

    static async getAllSavedPostsByUser(userId) {
        try {
            const userRef = await db.collection("users").doc(userId).get();
            const allPosts = [];

            if (userRef.exists) {
                await Promise.all(userRef.data().savedPosts.map(async (postId) => {
                    if (postId !== null) {
                        const post = await postService.getPostFromId(postId);
                        allPosts.push(post);
                    } else {
                        return new ApolloError("Some error occurred by fetching saved posts by user", "QUERY_FAILED")
                    }

                    return undefined;
                })).catch(error => {
                    console.log(error);
                    return new ApolloError("An unknown error occurred", "QUERY_FAILED");
                });
            } else {
                return new ApolloError(`User does not exist with id : ${userId}`, "INVALID_USER_ID");
            }

            return allPosts;
        }
        catch (error) {
            console.log(error);
            return new ApolloError("An unknown error occurred", "QUERY_FAILED");
        }
    }

    static async getSavedCountOnPost(postId) {
        try {
            const usersRef = await db.collection("users").where("savedPosts", "array-contains", postId).get();

            return usersRef.docs.length;
        }
        catch (error) {
            console.log(error);
            return new ApolloError("An unknown error occurred", "QUERY_FAILED");
        }
    }

    static async getAllFollowedTopicsByUser(userId) {
        try {
            const userRef = await db.collection("users").doc(userId).get();
            const allTopics = [];

            if (userRef.exists) {
                await Promise.all(userRef.data().followedTopics.map(async (topicName) => {
                    if (topicName) {
                        const topic = await topicService.getTopicFromTopicName(topicName);
                        allTopics.push(topic);
                    } else {
                        return new ApolloError("Some error occurred by fetching followed topics of user", "QUERY_FAILED");
                    }

                    return undefined;
                })).catch(error => {
                    console.log(error);
                    return new ApolloError("An unknown error occurred", "QUERY_FAILED");
                });

                return allTopics;
            } else {
                return new ApolloError(`User does not exist with id : ${userId}`, "INVALID_USER_ID");
            }

        }
        catch (error) {
            console.log(error);
            return new ApolloError("An unknown error occurred", "QUERY_FAILED");
        }
    }

    static async getDarkModeOfUser(userId) {
        try {
            const checkIfUserExists = await this.checkIfUserExists(userId);

            if (checkIfUserExists) {
                const user = await db.collection("users").doc(userId).get();

                if (user.exists) {
                    const darkMode = await user.data().darkMode;

                    return darkMode;
                } else {
                    return new ApolloError(`Some error occurred while updating dark mde property of user with id : ${userId}`, "USER_MUTATION_FAILED");
                }
            } else {
                return new ApolloError(`User does not exist with id : ${userId}`, "INVALID_USER_ID");
            }
        } catch (error) {
            console.log(error);
            return new ApolloError("An unknown error occurred", "USER_MUTATION_FAILED");
        }
    }

    static async enableDarkMode(userId) {
        try {
            const checkIfUserExists = await this.checkIfUserExists(userId);

            if (checkIfUserExists) {
                const darkModeEnabled = await db.collection("users").doc(userId).update({
                    darkMode: true
                });

                if (darkModeEnabled) {
                    return true;
                } else {
                    return new ApolloError(`Some error occurred while updating dark mde property of user with id : ${userId}`, "USER_MUTATION_FAILED");
                }
            } else {
                return new ApolloError(`User does not exist with id : ${userId}`, "INVALID_USER_ID");
            }
        } catch (error) {
            console.log(error);
            return new ApolloError("An unknown error occurred", "USER_MUTATION_FAILED");
        }
    }

    static async disableDarkMode(userId) {
        try {
            const checkIfUserExists = await this.checkIfUserExists(userId);

            if (checkIfUserExists) {
                const darkModeDisabled = await db.collection("users").doc(userId).update({
                    darkMode: false
                });

                if (darkModeDisabled) {
                    return true;
                } else {
                    return new ApolloError(`Some error occurred while updating dark mde property of user with id : ${userId}`, "USER_MUTATION_FAILED");
                }
            } else {
                return new ApolloError(`User does not exist with id : ${userId}`, "INVALID_USER_ID");
            }
        } catch (error) {
            console.log(error);
            return new ApolloError("An unknown error occurred", "USER_MUTATION_FAILED");
        }
    }

}


module.exports = UserService;