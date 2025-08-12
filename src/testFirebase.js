import { ref, set, get } from "firebase/database";
import { db } from "./firebase";

export function writeTestData() {
  set(ref(db, 'test'), {
    hello: "world"
  });
}

export async function readTestData() {
  const snapshot = await get(ref(db, 'test'));
  if (snapshot.exists()) {
    console.log(snapshot.val());
  } else {
    console.log("No data found");
  }
}
