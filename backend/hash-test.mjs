import argon2 from "argon2";

const password = "mysecretpassword";

const hashedPassword = await argon2.hash(password);

console.log("Hashed password:", hashedPassword);

const isPasswordValid = await argon2.verify(hashedPassword, password);

console.log("Is password valid?", isPasswordValid);