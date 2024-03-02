<?php
function exceptionHandler(Throwable $e) {
    $status = $e->getCode() != 0 ? $e->getCode() : 500;
    http_response_code($status);
    $datetime = new DateTime();
    echo json_encode([
        "timestamp" => $datetime->getTimestamp() * 1000,
        "status" => $status,
        "message" => $e->getMessage()
    ]);
}

set_exception_handler("exceptionHandler");
require("OAuth.php");
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header("Access-Control-Allow-Headers: X-Requested-With");
header("Content-Type: application/json");

if($_SERVER['REQUEST_METHOD'] != 'POST') throw new Exception("Bad Request", 403);

if(!isset($_GET['api']) || !isset($_GET['action'])) throw new Exception("Misunderstanding Request", 418);


$_POST = json_decode(file_get_contents('php://input'), true);

switch($_GET['api']) {
    case "noun":
        switch($_GET['action']) {
            case "search":
                return nounProject();
            case "get":
                return nounProject("/" . $_POST['id']);
            default:
                throw new Exception("Unknown action type", 400);
        }
        break;
    
    case "commons":
        return commons($_GET['page'] ?? 0);
    
    default:
        throw new Exception("This API doesn't supported", 401);
    
}

function nounProject($url_ = '', array $params = null) {
    $cc_key  = "edbb0134cbdb462f9bcca6af54895985";
    $cc_secret = "66e47d1907634dd1b5b812b48cb0c6d5";
    $url = "https://api.thenounproject.com/v2/icon" . $url_;
    $args = $params ?? $_POST;
    $args['include_svg'] = 1;
    $args["limit"] = 10;
    $args["blacklist"] = 1;
    $args['limit_to_public_domain'] = 1;

    $consumer = new OAuthConsumer($cc_key, $cc_secret);
    $request = OAuthRequest::from_consumer_and_token($consumer, NULL,"GET", $url, $args);
    $request->sign_request(new OAuthSignatureMethod_HMAC_SHA1(), $consumer, NULL);
    $url = sprintf("%s?%s", $url, OAuthUtil::build_http_query($args));
    $ch = curl_init();
    $headers = array($request->to_header());
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
    $rsp = curl_exec($ch);
    echo $rsp;
}

function commons($page = 0, $limit = 40) {
    $url = "https://commons.wikimedia.org/w/api.php?action=query&format=json&uselang=az&generator=search&gsrsearch=filetype%3Abitmap%7Cdrawing%20-fileres%3A0%20".$_POST['query']."&gsrlimit={$limit}&gsroffset=".($limit * $page)."&gsrinfo=totalhits%7Csuggestion&gsrprop=size%7Cwordcount%7Ctimestamp%7Csnippet&prop=info%7Cimageinfo%7Centityterms&inprop=url&gsrnamespace=6&iiprop=url%7Csize%7Cmime&iiurlheight=180&wbetterms=label";

    $data = [];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Disable SSL verification (for simplicity)
    $rsp = curl_exec($ch);

    $arr = json_decode($rsp, 1);


    if(!isset($arr['query']) || !is_array($arr['query']['pages'])) throw new Exception("Not found", 404);

    foreach($arr['query']['pages'] as $page) {
        if(!isset($page['imageinfo']) || !is_array($page['imageinfo'])) continue;
        
        foreach($page['imageinfo'] as $id => $image) {
            if(!preg_match('/svg|png|jpeg|jpg/', $image['mime'])) continue;

            array_push($data, [
                'id' => $image['url'],
                'attribution' => $page['title'],
                'thumbnail_url' => $image['url'],
                'creator' => ['name' => $image['mime']]
            ]);

        }
    }

    if(empty($data)) throw new Exception("Not found", 404);

    echo json_encode($data);
    exit;
}




