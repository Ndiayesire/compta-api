// import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import * as nodemailer from 'nodemailer';
// import { Transporter } from 'nodemailer';
// import { SendMailDto } from './dto/send-mail/send-mail.dto';
// import { welcomeTemplate } from './templates/welcome.template';

// @Injectable()
// export class MailerService implements OnModuleInit {
//   private readonly logger = new Logger(MailerService.name);
//   private transporter: Transporter;

//   constructor(private readonly configService: ConfigService) {}

//  onModuleInit() {
//     this.transporter = nodemailer.createTransport({
//         host: 'smtp.gmail.com',
//         port: 465,
//         secure: true,
//         auth: {
//             user: this.configService.get<string>('SMTP_USER'),
//             pass: this.configService.get<string>('SMTP_PASS'),
//         },
//         family: 4,
//         tls: {
//             rejectUnauthorized: false,
//         },
//     });

//   this.logger.log('Mailer service initialized ✅');
// }

//   /**
//    * Send a plain-text or HTML email.
//    */
//   // async sendMail(dto: SendMailDto): Promise<void> {
//   //   const { to, subject, text, html, cc, bcc, attachments } = dto;

//   //   const from =
//   //     dto.from ??
//   //     this.configService.get<string>('SMTP_FROM', '"No Reply" <no-reply@example.com>');

//   //   try {
//   //     const info = await this.transporter.sendMail({
//   //       from,
//   //       to,
//   //       cc,
//   //       bcc,
//   //       subject,
//   //       text,
//   //       html,
//   //       attachments,
//   //     });

//   //     this.logger.log(`Email sent to ${to} — messageId: ${info.messageId}`);
//   //   } catch (error : any) {
//   //     this.logger.error(`Failed to send email to ${to}`, error?.stack);
//   //     throw error;
//   //   }
//   // }

//   /**
//    * Verify SMTP connection (useful in health checks).
//    */
//   // async verifyConnection(): Promise<boolean> {
//   //   try {
//   //     await this.transporter.verify();
//   //     this.logger.log('SMTP connection verified successfully');
//   //     return true;
//   //   } catch (error : any) {
//   //     this.logger.error('SMTP connection verification failed', error?.stack);
//   //     return false;
//   //   }
//   // }

//   // async sendWelcome(to: string, firstName: string): Promise<void> {
//   //   const appName      = this.configService.get<string>('APP_NAME',      'MyApp');
//   //   const loginUrl     = this.configService.get<string>('APP_URL',       'https://yourapp.com/login');
//   //   const supportEmail = this.configService.get<string>('SUPPORT_EMAIL', 'support@yourapp.com');

//   //   await this.sendMail({
//   //     to,
//   //     subject: `Welcome to ${appName}, ${firstName}! 🎉`,
//   //     html: welcomeTemplate({ firstName, loginUrl, supportEmail, appName }),
//   //   });
//   // }
// }


