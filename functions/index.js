const admin = require('firebase-admin');
const serviceAccount = require("./admin-config.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://howcodingworks-official.firebaseio.com"
});

//===========================================================================================================//

const functions = require('firebase-functions');
const { graphql, buildSchema } = require('graphql');
const typeDefs = require("./schema/typeDefs.js");
const resolvers = require("./schema/resolvers.js");
const db = admin.firestore();
const adminService = require("./services/AdminService/AdminService.js");

const schema = buildSchema(typeDefs);

exports.graphql = functions.https.onCall(async (data, context) => {
    try {
        const result = await graphql(schema, data.query, resolvers);

        if (result && result.data && result.errors.length === 0) {
            return { data: result.data };
        } else {
            return { errors: result.errors };
        }
    } catch (error) {
        console.log(error);
        return { error }
    }
});


exports.auth = functions.https.onCall(async (data, context) => {
    try {
        const result = await adminService.authenticateUser(data.idToken);
        return { data: result };
    } catch (error) {
        console.log(error);
        return { error }
    }
});

exports.adminClaim = functions.https.onCall(async (data, context) => {
    try {
        const result = await adminService.giveAdminClaimsToUser(data.userId);
        return { data: result };
    } catch (error) {
        console.log(error);
        return { error }
    }
});

exports.addNewUserToDB = functions.auth.user().onCreate(async (user) => {
    try {
        const doc = await db.collection("users").doc(user.uid).set({
            followedTopics: [],
            savedPosts: [],
            darkMode: false
        });

        if (doc) {
            return "New user added to firestore";
        }
        else {
            throw Error("New user not added to firestore");
        }
    }
    catch (error) {
        console.log(error);
        return error;
    }
});