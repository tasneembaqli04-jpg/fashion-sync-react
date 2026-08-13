const { getFirestore } = require("firebase-admin/firestore");

async function getPolicyContent() {
  const snapshot = await getFirestore()
    .collection("settings")
    .doc("policyContent")
    .get();

  if (!snapshot.exists) {
    return null;
  }

  return snapshot.data();
}

async function getStoreDetails() {
  const snapshot = await getFirestore()
    .collection("settings")
    .doc("storeDetails")
    .get();

  if (!snapshot.exists) {
    return null;
  }

  return snapshot.data();
}

module.exports = {
  getPolicyContent,
  getStoreDetails,
};