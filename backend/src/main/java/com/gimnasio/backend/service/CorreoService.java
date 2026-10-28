package com.gimnasio.backend.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class CorreoService {
    private final JavaMailSender mailSender;
    private final String remitente;
    private final String urlAplicacion;

    public CorreoService(JavaMailSender mailSender,
                         @Value("${app.mail.from:no-reply@gimnasio.local}") String remitente,
                         @Value("${app.mail.reset-url:http://localhost:5173/restablecer}") String urlAplicacion) {
        this.mailSender = mailSender;
        this.remitente = remitente;
        this.urlAplicacion = urlAplicacion;
    }

    public void enviarRecuperacion(String destinatario, String token) {
        try {
            String enlace = urlAplicacion + "?token=" + token;
            MimeMessage mensaje = mailSender.createMimeMessage();
            mensaje.setFrom(remitente);
            mensaje.setRecipients(MimeMessage.RecipientType.TO, destinatario);
            mensaje.setSubject("Restablece tu contraseña del gimnasio", "UTF-8");
            mensaje.setText("Solicitaste restablecer tu contraseña. Abre este enlace dentro de los próximos 30 minutos:\n\n"
                    + enlace + "\n\nSi no solicitaste el cambio, ignora este mensaje.", "UTF-8");
            mailSender.send(mensaje);
        } catch (MessagingException | MailException ex) {
            throw new IllegalStateException("No se pudo enviar el correo de recuperación", ex);
        }
    }
}
