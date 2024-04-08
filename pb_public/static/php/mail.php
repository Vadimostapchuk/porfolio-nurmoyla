<?php 
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
 
require_once 'phpmailer/Exception.php';
require_once 'phpmailer/PHPMailer.php';
require_once 'phpmailer/SMTP.php';
 
// Для более ранних версий PHPMailer
//require_once '/PHPMailer/PHPMailerAutoload.php';
 
$mail = new PHPMailer;
$mail->CharSet = 'UTF-8';

$name = $_POST['user_name'];
$phone = $_POST['user_phone'];
$email = $_POST['user_email'];
$text = $_POST['user_text'];
 
// Настройки SMTP
$mail->isSMTP();
$mail->SMTPAuth = true;
$mail->SMTPDebug = 0;
 
$mail->Host = 'ssl://smtp.mail.ru';
$mail->Port = 465;
$mail->Username = 'ostv05@mail.ru';
$mail->Password = 'bW4UcdceN6EjiKaWXh5q';
 
// От кого
$mail->setFrom('vadim.ostapchuk.02@bk.ru', 'antiteplovisor.ru');		
 
// Кому
$mail->addAddress('antiteplovizor@mail.ru', 'antiteplovizor@mail.ru');
 
// Тема письма
$mail->Subject = 'Заявка с сайта';
 
// Тело письма
$body = '' .$name . ' оставил заявку! '.'' .$phone . ' - номер телефона '. ''.$text . ' - текст сообщения';
$mail->msgHTML($body);
 
$mail->send();
?>