const cookieParser = require('cookie-parser');
const express = require('express');
const app = express();
const userModel = require("./models/user");
const postModel = require("./models/post");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

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

        let token = jwt.sign({email, userid: newUser._id}, "secret key", {expiresIn: '10h'});
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
            let token = jwt.sign({email, userid: req.body._id}, "secret key", {expiresIn: '10h'})
            res.cookie("token", token);
            res.redirect("profile");
            
        }

        else
        {
            res.status(404).send("Something went wrong");
        }
    } )

})


//profile
app.get('/profile', isLoggedIn,async  (req,res)=>
{
    let {email} = req.user;

    let user = await userModel.findOne({email}).populate("posts");

   console.log(user); // posts have id's not actual content so we need to populate it

    res.render("profile", {user}); // user is an object so pass as an object
})



//write post
app.post('/post', isLoggedIn, async (req,res)=>
{
    let user = await userModel.findOne({email:req.user.email});
    let {content} = req.body;

    let post = await postModel.create({
        user: user._id,
        content
    });

    user.posts.push(post._id); // here we r adding posts id's in user's db, so fo accessing them we will need to use --populate-- (wherever needed) like in get profile route we will be populating the posts id.s 
    await user.save();
    res.redirect('/profile')

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
    if(req.cookies.token === "") return res.redirect("/login");

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