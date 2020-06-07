const admin = require("firebase-admin");
const env = require("./../../environment/env.js");

class AdminService {

    static async giveAdminClaimsToUser(uid) {
        try {
            if (uid === env.adminUid) {
                const customToken = await admin.auth().createCustomToken(uid, {
                    admin: true
                });

                return { "custom_token": customToken };
            } else {
                return { "error": "Access Denied" };
            }
        } catch (error) {
            console.log(error);
            return { "error": error };
        }
    }

    static async authenticateUser(idToken){
        try {
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            const uid = await decodedToken.uid;

            if (uid) {
                const customToken = await admin.auth().createCustomToken(uid);

                if(customToken){
                    return { 
                        "custom_token": customToken
                    };
                }else{
                    return { "error": "Invalid User Id (uid)" };
                }
            } else {
                return { "error": "Invalid User Id (uid)" };
            }
        } catch (error) {
            console.log(error);
            return { "error": error };
        }
    }

}


module.exports = AdminService;