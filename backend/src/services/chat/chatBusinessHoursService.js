const {getFirestore} = require("firebase-admin/firestore");

async function getBusinessHours() {
  const snapshot = await getFirestore()
      .collection("settings")
      .doc("businessHours")
      .get();

  if (!snapshot.exists) {
    return null;
  }

  return snapshot.data();
}

module.exports = {
  getBusinessHours,
};
