<?php
	$stringData = $_POST["data"];
	$myFile = "db.json";
	$fh = fopen($myFile, 'w') or die("Can't open file");
	
	if (isset($_POST["data"])) {
		$success = file_put_contents($myFile,$stringData);
		error_log("Oh no! $success", 1, "cathy.a.fisher@gmail.com");
	}

	fclose($fh);
	
?>