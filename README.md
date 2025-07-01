# Citation Detection by Bibliography
Users will get an option to upload a CSV file (specifications mentioned in the website).
After uploading, it will automatically get redirected to semantics scholar website. Users will get a prompt for human verification.
After the verfication, the details of the file uploaded will get displayed.

## Steps to use it

1. Clone or download the repository to your local machine.
2. Navigate to "client" folder.

3. Install the required npm version and update the local node_modules repository with the versions present in package.json:

   ```
   npm install
   ```

4. Navigate to the "server" directory and run the `server.js`:

   ```
   node server.js
   ```

5. Once the server started, you might see a message "Server running on port 3000".
6. Navigate to "client" directory on another terminal and run:
```
npm start
```

7. Open your browser and type localhost:3000, the home page of the application will get displayed.
