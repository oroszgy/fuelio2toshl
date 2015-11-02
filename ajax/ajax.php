<?
header("Content-Type: text/html; charset=utf-8");

// *****************************************************
// Toshl CSV Import - 2015
// toshlcsvimport@georgemagiafas.com
// *****************************************************

// *****************************************************
// Application Specific Variables
// *****************************************************
// Reference:
// https://developer.toshl.com/apps/new
// https://developer.toshl.com/docs/oauth
// *****************************************************
$APP_CLIENT_ID = "YOUR_TOSHL_APP_CLIENT_ID";
$APP_CLIENT_SECRET = "YOUR_TOSHL_APP_CLIENT_SECRET";

// *****************************************************
// Obtain access token
// *****************************************************
// Reference:
// https://developer.toshl.com/docs/oauth#token
// *****************************************************
function getToken($APP_CLIENT_ID, $APP_CLIENT_SECRET, $code) {
    $curl = curl_init();
    curl_setopt_array($curl, array(
        CURLOPT_RETURNTRANSFER => 1,
        CURLOPT_URL => "https://toshl.com/oauth2/token",
        CURLOPT_USERPWD => $APP_CLIENT_ID.":".$APP_CLIENT_SECRET,
        CURLOPT_POST => 1,
        CURLOPT_POSTFIELDS => array(
            "code" => $code,
            "scope" => "expenses:rw",
            "grant_type" => "authorization_code"
        )
    ));
    $resp = curl_exec($curl);
    // echo curl_error($curl);
    curl_close($curl);
    return $resp;
}

// *****************************************************
// Refresh access token
// *****************************************************
// Reference:
// https://developer.toshl.com/docs/oauth#refresh
// *****************************************************
function refreshToken($APP_CLIENT_ID, $APP_CLIENT_SECRET, $refresh_token) {
    $curl = curl_init();
    curl_setopt_array($curl, array(
        CURLOPT_RETURNTRANSFER => 1,
        CURLOPT_URL => "https://toshl.com/oauth2/token",
        CURLOPT_USERPWD => $APP_CLIENT_ID.":".$APP_CLIENT_SECRET,
        CURLOPT_POST => 1,
        CURLOPT_POSTFIELDS => array(
            "refresh_token" => $refresh_token,
            "scope" => "expenses:rw",
            "grant_type" => "refresh_token"
        )
    ));
    $resp = curl_exec($curl);
    curl_close($curl);
    return $resp;
}

// *****************************************************
// Get currently logged in user's data
// *****************************************************
// Reference:
// https://developer.toshl.com/docs/endpoints/me/get
// *****************************************************
function getUserInfo($token) {
    $curl = curl_init();
    curl_setopt_array($curl, array(
        CURLOPT_RETURNTRANSFER => 1,
        CURLOPT_HTTPHEADER => array(
            "Authorization: Bearer ".$token
        ),
        CURLOPT_URL => "https://api.toshl.com/me"
    ));
    $resp = curl_exec($curl);
    curl_close($curl);
    return $resp;
}

// *****************************************************
// Create a new expense
// *****************************************************
// Reference:
// https://developer.toshl.com/docs/endpoints/expenses/create
// *****************************************************
function postExpense($token, $amount, $date, $tags, $desc) {
    $curl = curl_init();
    $post_fields = array(
        "amount" => $amount,
        "date" => $date,
        "tags" => explode(",", urldecode($tags)),
        "desc" => urldecode($desc),
    );

    curl_setopt_array($curl, array(
        CURLOPT_RETURNTRANSFER => 1,
        CURLOPT_HTTPHEADER => array(
            "Accept: application/json",
            "Authorization: Bearer ".$token
        ),
        CURLOPT_URL => "https://api.toshl.com/expenses",
        CURLOPT_POST => 1,
        CURLOPT_POSTFIELDS => http_build_query($post_fields)
    ));
    $resp = curl_exec($curl);
    $resphttpcode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    curl_close($curl);
    return $resphttpcode;
}

// *****************************************************
//  Ajax Request Entry Point
// *****************************************************
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    if ($_POST["call"] == "getToken" && $_POST["code"]) {
        $code = $_POST["code"];
        echo getToken($APP_CLIENT_ID, $APP_CLIENT_SECRET, $code);
    } else if ($_POST["call"] == "getUserInfo" && $_POST["token"] && $_POST["refresh"]) {
        echo getUserInfo($_POST["token"]);
    } else if ($_POST["call"] == "postExpense" && $_POST["token"] && $_POST["refresh"] && $_POST["amount"] && $_POST["date"] && $_POST["tags"] && $_POST["desc"]) {
        echo postExpense($_POST["token"], $_POST["amount"], $_POST["date"], $_POST["tags"], $_POST["desc"]);
    }
}
?>