export default {
  info: (message) => {
    console.log(
      `[${new Date().toISOString()}][INFO] ${
        typeof message === "object" ? JSON.stringify(message, null, 2) : message
      }`
    );
  },
  error: (message) => {
    // make the error message red
    // console.error(
    //   `\x1b[31m[${new Date().toISOString()}][ERROR]\x1b[0m`,
    //   message
    // );

    console.error(
      `\x1b[31m[${new Date().toISOString()}][ERROR] ${
        typeof message === "object" ? JSON.stringify(message, null, 2) : message
      }\x1b[0m`
    );
  },
};
