// CloudFront viewer-request function for the static site (cloudfront-js-2.0).
// - www.<domain> -> <domain> (301)
// - /en -> /en/ (301), so relative links on the page resolve correctly
// - /en/ -> /en/index.html (S3 has no directory index)

function querystring(qs) {
  var parts = [];
  for (var key in qs) {
    var param = qs[key];
    var values = param.multiValue ? param.multiValue : [param];
    for (var i = 0; i < values.length; i++) {
      parts.push(key + (values[i].value !== "" ? "=" + values[i].value : ""));
    }
  }
  return parts.length ? "?" + parts.join("&") : "";
}

function redirect(location) {
  return {
    statusCode: 301,
    statusDescription: "Moved Permanently",
    headers: { location: { value: location } }
  };
}

function handler(event) {
  var request = event.request;
  var host = request.headers.host ? request.headers.host.value : "";
  var uri = request.uri;

  if (host.indexOf("www.") === 0) {
    return redirect("https://" + host.slice(4) + uri + querystring(request.querystring));
  }

  var last = uri.slice(uri.lastIndexOf("/") + 1);
  if (last !== "" && last.indexOf(".") === -1) {
    return redirect(uri + "/" + querystring(request.querystring));
  }

  if (uri.charAt(uri.length - 1) === "/") {
    request.uri = uri + "index.html";
  }
  return request;
}
