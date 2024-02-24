<?php

if($_SERVER['REQUEST_METHOD'] === 'POST') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST');
    header("Access-Control-Allow-Headers: X-Requested-With");
    require("OAuth.php");

    header("Content-Type: application/json");
    $_POST = json_decode(file_get_contents('php://input'), true);
    $cc_key  = "edbb0134cbdb462f9bcca6af54895985";
    $cc_secret = "66e47d1907634dd1b5b812b48cb0c6d5";
    $url = "https://api.thenounproject.com/v2/icon";
    $args = array();
    $args["query"] = $_POST['query'] ?? 'happy';
    $args['include_svg'] = 1;
    $args["limit"] = 10;

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
} else {
    echo "Bad Request";
    exit;
}
