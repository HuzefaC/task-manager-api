const express = require('express');
const userRouter = require('./routers/user');
const taskRouter = require('./routers/task');
require('./db/mongoose');

const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(userRouter);
app.use(taskRouter);

//
// Without middleware: new request -> run route handler
//
// With middleware: new request -> do something -> run route handler
//

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
