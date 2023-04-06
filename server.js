if (process.env.NODE_ENV !== 'production')
{
    require('dotenv').config()
}

const express = require('express')
const app = express()
const port = 3000

const bcrypt = require('bcrypt')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')

const usrs = []

//create and auth password
const createPassport = require('./passportConfig')
createPassport(
    passport,
    email => usrs.find(user => user.email === email),
    id => usrs.find(user => user.id === id)
) //initialized function that is initialize(passport, getUserByEmail, getUserById)

//look for ejs file in the view folder
app.set('view-engine', 'ejs')
app.use(express.urlencoded({extended: false}))
//send warnings if password is incorrect
app.use(flash())
//save location on the server
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))

//call function from the passportConfig.js
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))

//check the name so it's visible to the user
app.get('/', checkAuthenticaded, (req, res) => {
    res.render('index.ejs', {name: req.user.name})
})

app.get('/login', checkNotAuthenticaded, (req, res) => {
    res.render('login.ejs')
})

//1. access to css and js files in public folder
app.use(express.static('public'))
app.use('/css', express.static(__dirname + 'public/CSS'))
app.use('/js', express.static(__dirname + 'public/JS'))
app.use('/txt', express.static(__dirname + 'public/JS'))

//uses post to login and send to index.js
app.post('/login', checkAuthenticaded, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}))


//renders out register.ejs if not auth
app.get('/register', checkNotAuthenticaded, (req, res) => {
    res.render('register.ejs')
})

//uses post to store private secure data
app.post('/register', checkNotAuthenticaded, async (req, res) => {
    try{
        const hashedPassword = await bcrypt.hash(req.body.password, 8)
        usrs.push({
            id: Date.now().toString(),
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword
        })
        res.redirect('/login')
    } catch {
        res.redirect('/register')
    }
    console.log(usrs)
})

//log user out
app.delete('/logout', (req, res, next) => {
    req.logOut()
    res.redirect('/login')
})

//function for verification
function checkAuthenticaded(req, res, next) 
{
    if (req.isAuthenticated()) 
    {
        return next()
    }

    res.redirect('/login')
}

//function to check auth and redirect to index.ejs
function checkNotAuthenticaded(req, res, next) 
{
    if (req.isAuthenticated())
    {
        return res.redirect('/')
    }
    next()
}

//listens on port 3000 of my localhost
app.listen(port, () => console.log(`Example app listening on port ${port}!`))