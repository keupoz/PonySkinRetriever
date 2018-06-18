const
Express = require('express'),
App     = Express(),
PORT    = process.env.PORT || 3000,

Request   = require('request'),
API_URL   = 'https://api.mojang.com/users/profiles/minecraft/%s',
SKINS_URL = 'http://skins.voxelmodpack.com/skins/%s.png';


function getURL (pattern, replace) {
	return pattern.replace(/%s/g, replace);
}


App.get('/', function (request, response) {
	console.log('Request with no nickname provided');
	
	response.status(400).send('Please, provide a nickname')
});

App.get('/favicon.ico', function (request, response) {
	response.sendStatus(404);
});

App.get('/:nickname', function (request, response) {
	let nickname = request.params.nickname;
	
	console.log('Requested nickname: ' + nickname);
	
	response.set({
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Expose-Headers': 'X-Nickname'
	});
	
	Request(getURL(API_URL, nickname), {json: true}, function (error, apiResponse, body) {
		if (error) throw new Error(error);
		if (apiResponse.statusCode == 204) return response.status(404).send('No profile for provided nickname (' + nickname + ')');
		
		Request(getURL(SKINS_URL, body.id))
			.on('response', function (message) {
				if (message.statusCode == 404) return response.status(404).send('No skin for nickname "' + body.name + '"');
				
				response.set({
					'X-Nickname': body.name,
					'Content-Type': 'image/png',
					'Content-Disposition': 'inline; filename="' + body.name + '.png"',
					'Content-Length': message.headers['content-length']
				});
				
				message.on('data', function (data) {
					response.write(data);
				})
				.on('end', function () {
					response.end();
				});
			});
	});
});

App.listen(PORT, function (err) {
	if (err) return console.error('Error occured:', err);
	
	console.log('Server is listening on port ' + PORT);
});