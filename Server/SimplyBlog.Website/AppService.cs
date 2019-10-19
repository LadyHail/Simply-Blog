﻿using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.IdentityModel.Tokens;
using SimplyBlog.Core.Concrete;
using SimplyBlog.Website.Configuration;
using SimplyBlog.Website.Models.DTOs;
using SimplyBlog.Website.Models.Response;

namespace SimplyBlog.Website
{
    public class AppService
    {
        private readonly IWritableOptions<Credentials> writableCredentials;
        private readonly IWritableOptions<Secret> writableSecret;
        private readonly IWritableOptions<AboutWritableOption> writableAbout;
        private readonly IWritableOptions<HeaderWritableOption> writableHeader;

        public AppService(IWritableOptions<Credentials> writableCredentials, IWritableOptions<Secret> writableSecret, IWritableOptions<AboutWritableOption> writableAbout, IWritableOptions<HeaderWritableOption> writableHeader)
        {
            this.writableCredentials = writableCredentials;
            this.writableSecret = writableSecret;
            this.writableAbout = writableAbout;
            this.writableHeader = writableHeader;
        }

        public LoginResponse Authenticate(string username, string password)
        {
            if (!ValidateUser(username, password))
            {
                return new LoginResponse()
                {
                    Error = "Invalid Username or Password."
                };
            }

            byte[] key = Encoding.ASCII.GetBytes(writableSecret.Value.Value);
            LoginResponse response = GetSecurityToken(key, username);

            return response;
        }

        private LoginResponse GetSecurityToken(byte[] key, string username)
        {
            JwtSecurityTokenHandler tokenHandler = new JwtSecurityTokenHandler();

            DateTime expDate = DateTime.UtcNow.AddDays(3);
            SecurityTokenDescriptor tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new Claim[]
                {
                    new Claim(ClaimTypes.Name, username)
                }),
                Expires = expDate,
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            SecurityToken token = tokenHandler.CreateToken(tokenDescriptor);
            LoginResponse response = new LoginResponse()
            {
                Token = tokenHandler.WriteToken(token),
                ExpirationDate = expDate
            };

            return response;
        }

        public bool ValidateUser(string username, string password)
        {
            string login = writableCredentials.Value.Login;
            string hashPassword = writableCredentials.Value.Password;

            bool validPassword = VerifyPassword(hashPassword, password);

            return username == login && validPassword;
        }

        private static bool VerifyPassword(string hash, string password)
        {
            byte[] hashBytes = Convert.FromBase64String(hash);
            byte[] salt = new byte[16];
            Array.Copy(hashBytes, 0, salt, 0, 16);

            Rfc2898DeriveBytes encryption = new Rfc2898DeriveBytes(password, salt, 10000);
            byte[] hashedPassword = encryption.GetBytes(20);

            bool valid = true;
            for (int i = 0; i < 20; i++)
            {
                if (hashBytes[i + 16] != hashedPassword[i])
                {
                    valid = false;
                }
            }

            return valid;
        }

        public void ChangePassword(string newPassword)
        {
            string newHashedPassword = HashPassword(newPassword);

            writableCredentials.Update(opt =>
            {
                opt.Password = newHashedPassword;
            });
        }

        //Ref: https://medium.com/@mehanix/lets-talk-security-salted-password-hashing-in-c-5460be5c3aae
        private static string HashPassword(string password)
        {
            byte[] salt;
            new RNGCryptoServiceProvider().GetBytes(salt = new byte[16]);
            Rfc2898DeriveBytes encryption = new Rfc2898DeriveBytes(password, salt, 10000);
            byte[] hashed = encryption.GetBytes(20);
            byte[] hashBytes = new byte[36];
            Array.Copy(salt, 0, hashBytes, 0, 16);
            Array.Copy(hashed, 0, hashBytes, 16, 20);

            return Convert.ToBase64String(hashBytes);
        }

        public void ChangeLogin(string newLogin)
        {
            writableCredentials.Update(opt =>
            {
                opt.Login = newLogin;
            });
        }

        public void ChangeSecret(string newSecret)
        {
            if (newSecret.Length < 64)
            {
                throw new ArgumentException("New secret must be at least 64 characters long.");
            }

            writableSecret.Update(opt =>
            {
                opt.Value = newSecret;
            });
        }

        public async Task UpdateAbout(EditAboutDto model)
        {
            Guid? imageId = writableAbout.Value.ImageId;

            if (!model.UseExistingImage)
            {
                imageId = await ImageHandler.SaveImageToFile(model.Image);
            }

            writableAbout.Update(opt =>
            {
                opt.About = model.About;
                opt.ImageId = imageId;
            });
        }

        public async Task UpdateHeader(IFormFile image)
        {
            Guid? imageId = await ImageHandler.SaveImageToFile(image);
            writableHeader.Update(opt =>
            {
                opt.ImageId = imageId;
            });
        }

        public async Task<string> UploadImage(string hostPath, IFormFile image)
        {
            Guid? id = await ImageHandler.SaveImageToFile(image);
            return ImageHandler.GetImageUri(hostPath, id);
        }
    }
}
