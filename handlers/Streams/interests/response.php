<?php
	
function Streams_interests_response()
{
	// serve a javascript file and tell client to cache it
	$communityId = Q::ifset($_REQUEST, 'communityId', Users::communityId());
	$skipStreams = filter_var(Q::ifset($_REQUEST, 'skipStreams', false), FILTER_VALIDATE_BOOLEAN);
	$interests = Streams::interests($communityId, $skipStreams);
	header('Content-Type: text/javascript');
	header("Pragma: cache");
	header("Cache-Control: public, max-age=60"); // cache for 1 minute
	$expires = date("D, d M Y H:i:s T", time() + 60); // cache for 1 minute
	header("Expires: $expires");
	$ordering = Q::ifset($interests, '@summary', 'ordering', 
		Q::ifset($interests, '#', 'ordering', false)
	);
	unset($interests['@summary']);
	unset($interests['#']);
	if (!$ordering) {
		$ordering = array_keys($interests);
	}
	$o_json = Q::json_encode($ordering);
	echo "Q.setObject(['Q', 'Streams', 'Interests', 'ordering', '$communityId'], $o_json);\n\n";
	$info = array();
	foreach ($interests as $k => &$v) {
		if (!empty($v['@info'])) {
			$info[$k] = $v['@info'];
			unset($v['@info']);
		}
		if (!empty($v['#'])) { // for backward compatibility
			$info[$k] = $v['#'];
			unset($v['#']);
		}
	}
	$all_json = Q::json_encode((object)$interests);
	$info_json = Q::json_encode((object)$info);
 	echo "Q.setObject(['Q', 'Streams', 'Interests', 'all', '$communityId'], $all_json);\n\n";
	echo "Q.setObject(['Q', 'Streams', 'Interests', 'info', '$communityId'], $info_json);";
	return false;
}