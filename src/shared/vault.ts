import { getStorage, setStorage } from "./storage";

export const getSecret = async (id: string): Promise<string | null> => {
  const secrets = await getStorage("secrets");
  return secrets[id] ?? null;
};

export const saveSecret = async (id: string, value: string): Promise<boolean> => {
  const secrets = await getStorage("secrets");
  await setStorage("secrets", { ...secrets, [id]: value });
  return true;
};

export const deleteSecret = async (id: string): Promise<boolean> => {
  const secrets = await getStorage("secrets");
  const { [id]: _removed, ...rest } = secrets;
  await setStorage("secrets", rest);
  return true;
};
