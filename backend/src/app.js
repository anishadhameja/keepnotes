const express = require('express');
const fileUpload = require('express-fileupload');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 3000;
const path = require('path');
let alert = require('alert');
var loggedin;
var multer = require('multer');
var nodemailer = require('nodemailer');
var ranOTP;
var passwordValidator = require('password-validator');
 
app.use(fileUpload());

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Ani@2310",
    database: "keepnotes"
});

con.connect(function (err) {
    if (err) throw err;
    //console.log("Connected!");
});


const static_path = path.join(__dirname, "../public");
const view_path = path.join(__dirname, "../templates/views");

app.set("view engine", "ejs");
app.use(express.static(static_path));
app.set("views", view_path);
app.use(express.static('upload'));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));


app.get("/", (req, res, next) => {
    res.render("registerpage");
})


app.post("/register", async (req, res, next) => {
    try {
        const username = req.body.username;
        const password = req.body.password;
        var schema = new passwordValidator();
        schema
        .is().min(8)                                    // Minimum length 8
        .is().max(100)                                  // Maximum length 100
        .has().uppercase()                              // Must have uppercase letters
        .has().lowercase()                              // Must have lowercase letters
        .has().digits(1)                                // Must have at least 1 digit
        .has().not().spaces()                           // Should not have spaces
        .is().not().oneOf(['Passw0rd', 'Password123']); // Blacklist these values
        
        if(schema.validate(password)){
        const newusername = username.split("@")[0];
        var newuser = newusername;
        if (newusername.indexOf('.') !== -1)
            newuser = newusername.replace(".", "_");
        //console.log(newuser);
        //console.log(newusername);
        const insert = "insert into users (email,password) values('" + username + "','" + password + "');";
        let check = "select * from users where email = '" + username + "';";
        await con.query(check, function (err, result, record) {
            if (err) throw err;
            if (result.length > 0) {
                res.render("registerpage");
                alert("Username already exists!");
            }
            else {
                let createUser = "create table " + newuser + "(title varchar(800), message varchar(800), dateofnote varchar(40), timeofnote time, id int auto_increment primary key);";

                con.query(insert, function (err, result, record) {
                    if (err) throw err;
                    res.render("registerpage");
                    alert("Registration Successful!")
                });

                con.query(createUser, function (err, result, record) {
                    if (err) throw err;
                })
            }

        });
        }
        else{
            res.render("registerpage");
            alert(`            At least 8 characters
            A mixture of both uppercase and lowercase letters.
            A mixture of letters and numbers.
            Inclusion of at least one special character, e.g., ! @ # ? ] 
            Note: do not use < or > in your password, as both can cause                   problems in Web browsers.`);
            
        }


    }
    catch (error) {

    }
})


app.post("/insert", async (req, res, next) => {
    try {
        const newusername = loggedin.split("@")[0];
        var newuser = newusername;
        if (newusername.indexOf('.') !== -1)
            newuser = newusername.replace(".", "_");
        const title = req.body.title;
        const subject = req.body.subject;

        let date_ob = new Date();

        // current date
        // adjust 0 before single digit date
        let date = ("0" + date_ob.getDate()).slice(-2);

        // current month
        let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);

        // current year
        let year = date_ob.getFullYear();

        // current hours
        let hours = date_ob.getHours();

        // current minutes
        let minutes = date_ob.getMinutes();

        // current seconds
        let seconds = date_ob.getSeconds();

        let currentDate = year + "-" + month + "-" + date;
        let currentTime = hours + ":" + minutes + ":" + seconds;

        // console.log(currentDate);
        // console.log(currentTime);

        let message = "insert into " + newuser + " (title,message,dateofnote,timeofnote) values('" + title + "','" + subject + "','" + currentDate + "','" + currentTime + "');"

        await con.query(message, (err, result, record) => {
            if (err) throw err;
            let q = "select * from " + newuser + ";"
            con.query(q, (err, result, record) => {
                if (err) throw err;
                res.render("home", { records: result });
            });
        });
    }
    catch (error) {

    }
})


app.get("/login", (req, res, next) => {
    res.render("loginpage");
})

app.post("/login", async (req, res, next) => {
    try {
        const email = req.body.username;
        const password = req.body.password;
        const newusername = email.split("@")[0];
        var newuser = newusername;
        if (newusername.indexOf('.') !== -1)
            newuser = newusername.replace(".", "_");
        let q = "select * from " + newuser + ";"
        //console.log(email);
        let check = "select * from users where email = '" + email + "' and password = '" + password + "';";
        await con.query(check, (err, result, record) => {
            if (err) throw err;
            if (result.length > 0) {
                loggedin = email;
                con.query(q, (err, result, record) => {
                    if (err) throw err;
                    if (result.length > 0) {
                        res.render("home", { records: result });
                    }
                    else {
                        res.render("home", { records: null });
                    }
                })

            }
            else {
                res.render("loginpage");
                alert("Invalid credentials");
            }
        })
    }
    catch (error) {

    }
})


app.get("/home", (req, res, next) => {
    const newusername = loggedin.split("@")[0];
    var newuser = newusername;
    if (newusername.indexOf('.') !== -1)
        newuser = newusername.replace(".", "_");
    let q = "select * from " + newuser + ";"
    con.query(q, (err, result, record) => {
        if (err) throw err;
        if (result.length > 0) {
            //console.log(result[0].dateofnote);
            res.render("home", { records: result });
        }
        else {
            res.render("home", { records: null });
        }
    })

});


app.get("/insert", (req, res, next) => {
    res.render("insert");
});


app.get("/view", (req, res, next) => {
    let id = req.query.id;
    const newusername = loggedin.split("@")[0];
    var newuser = newusername;
    if (newusername.indexOf('.') !== -1)
        newuser = newusername.replace(".", "_");
    let q = "select * from " + newuser + " where id='" + id + "';";
    con.query(q, (err, result, record) => {
        if (err) throw err;
        res.render("view", { records: result });
    })

})


app.get("/profile", (req, res, next) => {
    let select = "select * from users where email = '" + loggedin + "';";
    con.query(select, (err, result, record) => {
        if (err) throw err;
        //console.log(result[0].image_name);
        res.render("profile", { records: result });
    })
})


app.post("/profile", (req, res, next) => {
    const old = req.body.password;
    const newpass = req.body.new_password;
    const confirmpass = req.body.confirm_password;
    let img = req.files.uploaded_image;
    // console.log(img);
    // console.log(typeof (img));
    // console.log(__dirname);
    let uploadpath = __dirname + '/upload/' + img.name;
    let select = "select * from users where email='" + loggedin + "';";
    con.query(select, (err, result, record) => {
        if (err) throw err;
        if (old === "" && newpass === "" && confirmpass === "") {
            img.mv(uploadpath, (err) => {
                if (err) {
                    return res.status(500).send(err);
                }
                let upimage = "update users set image_name = '" + img.name + "' where email = '" + loggedin + "';"
                con.query(upimage, (err, result, record) => {
                    if (err) throw err;
                    con.query(select, (err, result, record) => {
                        res.render("profile", { records: result });
                        alert("Profile Picture Updated!")
                    })
                })

            });
        }
        else if (old === result[0].password) {
            if (newpass === confirmpass) {
                img.mv(uploadpath, (err) => {
                    if (err) {
                        return res.status(500).send(err);
                    }
                    let update = "update users set password = '" + newpass + "',image_name = '" + img.name + "' where email = '" + loggedin + "';";
                    con.query(update, (err, result, record) => {
                        if (err) throw err;
                        let select = "select * from users where email = '" + loggedin + "';";
                        con.query(select, (err, result, record) => {
                            if (err) throw err;
                            res.render("profile", { records: result });
                            alert("Profile Updated!");
                        })
                    })
                })
            }
            else {
                alert("Confirm Password does not match!");
                let select = "select * from users where email = '" + loggedin + "';";
                con.query(select, (err, result, record) => {
                    if (err) throw err;
                    res.render("profile", { records: result });
                })
            }
        }
        else {
            alert("Wrong Password")
            let select = "select * from users where email = '" + loggedin + "';";
            con.query(select, (err, result, record) => {
                if (err) throw err;
                res.render("profile", { records: result });
            })
        }
    })
})


app.get("/logout", (req, res, next) => {
    res.render("registerpage");
})


app.post("/view", async (req, res, next) => {
    try {
        const title = req.body.title;
        const subject = req.body.subject;
        //let id = req.query.id;
        const changeid = req.body.id;
        const newusername = loggedin.split("@")[0];
        var newuser = newusername;
        if (newusername.indexOf('.') !== -1)
            newuser = newusername.replace(".", "_");
        let update = "update " + newuser + " set title = '" + title + "', message = '" + subject + "' where id = " + changeid + ";";
        await con.query(update, (err, result, record) => {
            if (err) throw err;
            let select = "select * from " + newuser + " where id=" + changeid + ";"
            con.query(select, (err, result, record) => {
                if (err) throw err;
                res.render("view", { records: result });
                alert("Updated successfully!")
            })

        })
    }
    catch (error) {

    }
})


app.get('/delete', (req, res) => {
    let id = req.query.id;
    const newusername = loggedin.split("@")[0];
    var newuser = newusername;
    if (newusername.indexOf('.') !== -1)
        newuser = newusername.replace(".", "_");
    let del = "delete from " + newuser + " where id=" + id + ";";
    con.query(del, (err, result, record) => {
        if (err) throw err;
        res.redirect("/home");
    })
})


app.get("/forgotpassword", (req,res,next)=>{
    res.render("forgotpassword");
});

app.post("/forgotpassword", (req,res,next)=>{
    const em = req.body.username;
    loggedin = em;
    let select = "select * from users where email = '"+em+"';";
    let randomotp = Math.floor(Math.random() * 100000);    
    ranOTP = randomotp;
    con.query(select, (err, result,record)=>{
        if(err)throw err;
        if(result.length>0){
            var transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                  user: 'dhameja.anisha@gmail.com',
                  pass: 'ani@2310'
                }
              });
              
            var mailOptions = {
                from: 'dhameja.anisha@gmail.com',
                to: result[0].email,
                subject: 'OTP',
                text: ranOTP.toString()
              };
              
              transporter.sendMail(mailOptions, function(error, info){
                if (error) {
                  //console.log(error);
                  alert("");
                } else {
                  //console.log('Email sent: ' + info.response);
                }
              });
              res.render("otp");
        }
    })
    
})


app.get("/otp",(req,res,next)=>{
    res.render("otp");
})

app.post("/otp", (req,res,next)=>{
    const otp = req.body.otp;
    if(ranOTP == otp){
        res.render("reset");
    }
    else{
        alert("Invalid OTP");
    }
})

app.post("/reset", (req,res,next)=>{
    const pass = req.body.password;
    const newpass = req.body.confirmPassword;
    let update = "update users set password = '"+pass+"' where email='"+loggedin+"';"
    if(pass === newpass){
        con.query(update, (err, result,record)=>{
            if(err)throw err;
            const newusername = loggedin.split("@")[0];
            var newuser = newusername;
            if (newusername.indexOf('.') !== -1)
                newuser = newusername.replace(".", "_");
            let q = "select * from " + newuser + ";"
            con.query(q, (err, result, record) => {
                if (err) throw err;
                if (result.length > 0) {
                    // console.log(result[0].dateofnote);
                    res.render("home", { records: result });
                    alert("Changes Successful!");
                }
                else {
                    res.render("home", { records: null });
                    alert("Changes Successful!");
                }
            })
      
        })
    }
})


app.listen(port, () => {
    //console.log("PORT NUMBER ", port);
});
