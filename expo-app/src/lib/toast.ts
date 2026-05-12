import { Alert } from "react-native";

function show(msg: string) {
  Alert.alert("", msg);
}

show.success = (msg: string) => Alert.alert("", msg);
show.error = (msg: string) => Alert.alert("Error", msg);
show.info = (msg: string) => Alert.alert("", msg);

export const toast = show;
