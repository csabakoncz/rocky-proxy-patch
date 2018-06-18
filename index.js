//invoke this before requiring Rocky

require('./rocky-patch');
const fs = require('fs')
const rocky = require('rocky')
const cors = require('cors')
const Agent = require('https-proxy-agent')
//const Agent = require('http-proxy-agent')

var corsCredentials = process.env.CORS_CREDENTIALS == 'true';
console.log(' CORS credentials =', corsCredentials);

var httpsProxy='http://some-host:some-port'

const proxy = rocky({
    secure: false,
    agent: new Agent(httpsProxy),
    ssl: {
        key: fs.readFileSync('server.key'),
        cert: fs.readFileSync('server.crt')
    },
    changeOrigin: true,
    autoRewrite: true

})

var targetHost = process.env.TARGET_HOST || 'target-host.com' 
var targetUrl = 'https://' + targetHost;

console.log('targetHost is ' + targetHost);

proxy
    .forward(targetUrl)
    .all('/*')
    .use(cors({
        origin: true,
        credentials: corsCredentials
    }))
    .useResponse(function(req,res,next){
        // console.log('res.headers: ',res.getHeaders());
        var headers = res.getHeaders();

        //correct origin response:
        var targetAllowOrigin = headers['access-control-allow-origin'];
        var reqOrigin = req.headers.origin;
        if(reqOrigin){
            if(reqOrigin !== targetAllowOrigin){
                console.log('reqOrigin=%s, targetAllowOrigin=%s, overriding', reqOrigin,targetAllowOrigin);
                res.setHeader('access-control-allow-origin',reqOrigin);
            }
        }


        var cookies = headers['set-cookie'];
        var hackedCookies;

        if(cookies){
            hackedCookies = cookies.map(cookieString=>cookieString.replace(/ SameSite=Lax;/,''))
        }
        if(hackedCookies){
            res.setHeader('set-cookie',hackedCookies)
        }

        res.setHeader('Server','patched-rocky-proxy')
        next()
    })
    .use((req, res, next) => {
        // console.log('req', req.headers)
        // delete req.headers.host;
        // req.headers.host = targetHost
        // req.headers.referer = targetUrl
        
        //this setting seems important:
        // req.headers.origin = targetUrl
        next()
    })

port = process.env.HTTP_PORT || 11443;

proxy.listen(port)
console.log('HTTP server listening on port:', port)

