const cookieParser = require('cookie-parser');
const express = require('express')
const app = express();
const userModel = require("./models/user")
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

app.set('view engine', "ejs");
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(cookieParser())


app.get('/', (req,res)=>
{
    res.render("index")
})


//register user
app.post('/register', async (req,res)=>
{
    let {username,name,email,age,password} = req.body;

    let user = await userModel.findOne({email});

    if(user) return res.send("User Already registered, Kindly loign");

    bcrypt.hash(password,10, async (err,hash)=>{

        let newUser = await userModel.create({
            username,
            name,
            email,
            age,
            password:hash
        })

        let token = jwt.sign({email, userid: newUser._id}, "secret key");
        res.cookie("token", token);
        res.send(newUser);
    })


})



// login
app.get('/login', (req,res)=>
{
    res.render('login');
})

app.post('/login', async (req,res)=>
{
    let {email, password} = req.body;

    let user = await userModel.findOne({email})
    if(!user) return res.send('Something went wrong!');


    bcrypt.compare(password, user.password, (err,result)=>
    {
        if(result)
        {
            let token = jwt.sign({email, userid: req.body._id}, "secret key")
            res.cookie("token", token);
            res.send("logged in");
            
        }

        else
        {
            res.status(404).send("Something went wrong");
        }
    } )

})


//profile
app.get('/profile', isLoggedIn, (req,res)=>
{
    res.send("profile");
})






//logout
app.get('/logout', (req,res)=>
{
    res.cookie("token", "");
    res.redirect('/login');
})


//protected routes
function isLoggedIn(req,res,next)
{
    if(req.cookies.token === "") return res.send("You must be logged in");

    else{
        let data = jwt.verify(req.cookies.token,"secret key")
        req.user = data      // sent data to req.user, so that the data can be accessed from req.user
        next();
    }
}

app.listen(3000, (err)=>
{
    console.log(`Server chalu hai`);
})