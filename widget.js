var socket;

function startSocket() {
 
    namespace = '/test_local';    
    //var socket = io.connect('http://localhost:9000/test_local',{'rememberTransport': false, 'force new connection':true})
    socket = io.connect('http://localhost:5000/test_local',{'rememberTransport': false, 'force new connection':true})
    //socket = io.connect('http://' + document.domain + ':' + location.port + namespace); //USE THIS TO AVOID SESSION ERRORS
    
    socket.on('connect', function() {
        socket.emit('joined', {room: $('#userid').val()});
    });

    socket.on('local_window', function(msg) {
        $('#log').append('<br>' + $('<div/>').text('Received: ' + msg.data).html());
    });

    socket.on('local_request', function(msg) {
        console.log(msg.data);
        /*if(msg.data == 'test_tally') {
            $('#log').append('<br>' + $('<div/>').text('Sending Data to Tally').html());
            //Ping Tally here
            pingTally(null);
        }  */     
        pingTally(msg.data);
    });

    $('form#emit2web').submit(function(event) {
        socket.emit('local_response', {room: $('#userid').val(), response:$('#emit2web_data').val()});
        return false;
    });
};//end Startsocket function

$('form#disconnect').submit(function(event) {
    socket.emit('left', {room: $('#userid').val()});
    return false;
});

function postHTTPAsync(theUrl, message) {
    var xhr = new XMLHttpRequest();
    xhr.onloadstart = function () {
        $('#log').append('<span class="prepended"><br> Processing..</span>')
      };
    xhr.ontimeout = function (e) {
        // XMLHttpRequest timed out. Do something here.
        $(".prepended").remove();
        $('#log').append('<br> Timeout.' + xhr.statusText)
        socket.emit('local_response', {response: 'TIMEOUT.' + xhr.statusText, room: $('#userid').val()});
      };
  
    xhr.onload = function() {
    if (xhr.readyState == XMLHttpRequest.DONE) {
        //alert(xhr.responseText);
        $(".prepended").remove();
        if (xhr.status == 200) {
            console.log(xhr.responseText)
            $('#log').append('<br>' + xhr.responseText + 'status: '+ xhr.status)
            socket.emit('local_response', {response: xhr.responseText, room: $('#userid').val()});
        }
        else {
            $('#log').append('<br> Error.' + xhr.statusText)
            socket.emit('local_response', {response: 'Error.' + xhr.statusText, room: $('#userid').val()});
        }//end else     */  
     }//end DONE request
    };//end onLOAD
    xhr.onerror = function (e) {
        $('#log').append('<br> ERROR REQUEST.' + xhr.statusText);
        socket.emit('local_response', {response: 'BAD REQUEST..' + xhr.statusText, room: $('#userid').val()});
      };

xhr.open('POST', theUrl, true);//async operation
xhr.timeout = 3000; // time in milliseconds
xhr.send(message);
}


function pingTally(message) {
   //load URL of Tally
   //DEBUG
    //input_url = "http://192.168.0.15:9000"
    
    input_url = $('#tallyURL').val();
    //alert(input_url);
    //CHECK VALID URL AND SEND MESSAGE TO TALLY
    if (!ValidURL(input_url)) {
        $('#log').append('<br> INVALID URL.');
    }
    else {
        postHTTPAsync(input_url, message);
        //$('#log').append('<br><span class= + 'Posted to:' + input_url) //for sync request
    }//end else
};

function XML_req() {
    var req = `<ENVELOPE>
    <HEADER>
    <TALLYREQUEST>Export Data</TALLYREQUEST>
    </HEADER>
    <BODY>
    <EXPORTDATA>
    <REQUESTDESC>
    <STATICVARIABLES>
    <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
    </STATICVARIABLES>
    <REPORTNAME>Trial Balance</REPORTNAME>
    </REQUESTDESC>
    </EXPORTDATA>
    </BODY>
    </ENVELOPE>`
    //console.log(req)
    return req
}

//https://stackoverflow.com/questions/5717093/check-if-a-javascript-string-is-a-url/34695026
function ValidURL(str) {
    /*var pattern = new RegExp('^(https?:\/\/)?'+ // protocol
      '((([a-z\d]([a-z\d-]*[a-z\d])*)\.)+[a-z]{2,}|'+ // domain name
      '((\d{1,3}\.){3}\d{1,3}))'+ // OR ip (v4) address
      '(\:\d+)?(\/[-a-z\d%_.~+]*)*'); // port and path
      //'(\?[;&a-z\d%_.~+=-]*)?'+ // query string
      //'(\#[-a-z\d_]*)?$','i'); // fragment locater*/

      //https://www.debuggex.com/r/KaJrYj7vm9pKgOhK
      var pattern = new RegExp('^((https?)?://)?(([0-9a-z_!~*\'().&=+$%-]+: )?[0-9a-z_!~*\'().&=+$%-]+@)?(([0-9]{1,3}\.){3}[0-9]{1,3}|([0-9a-z_!~*\'()-]+\.)*([0-9a-z][0-9a-z-]{0,61})?[0-9a-z]\.[a-z]{2,6}|localhost)(:[0-9]{1,5})');
    if(!pattern.test(str)) {
      //alert("Please enter a valid URL.");
      return false;
    } else {
        //alert("Its valid URL.");
      return true;
    }
  }

function postHTTPsync(theUrl) {
    var xmlHttp = null;
    xmlHttp = new XMLHttpRequest()  
    xmlHttp.open("POST", theUrl, false) //false is for synchronous requests.
    try {
        xmlHttp.send(null)
    } catch (error) {
        return '<br>Could not load URL. Please see Tally.'
    }
    return xmlHttp.responseText 
};//end httpPOST function

function postAJAX(theUrl) {
    $.ajax({
        type: "POST",
        url: theUrl,
        contentType: "application/xml",
        beforeSend: function() {
           $('#log').append('<span class="prepended"><br> Processing. Please wait.. </span>');
        },
        complete: function() {
            $('#log').append("<br> Processed.");
        },
        error: function(xhr, statusText) { 
            $(".prepended").remove();
            $('#log').append("<br> Error: "+statusText); 
            },
        success: function(tally_response){ 
            alert(tally_response.responseText)
            $(".prepended").remove();
            if (tally_response.responseText == undefined) {
                $('#log').append("<br> Wrong URL. See Tally for the correct URL.");
            }
            else {
                $('#log').append("<br> Success - "+ tally_response.responseText);
            }
        },
        timeout: 3000 // sets timeout to 3 seconds
    });
}