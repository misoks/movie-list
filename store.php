<?php
	$myFile = "db.json";
	$fh = fopen($myFile, 'w') or die("can't open file");
	$stringData = $_POST["data"];
	file_put_contents($myFile,$stringData);
	fclose($fh)
?>