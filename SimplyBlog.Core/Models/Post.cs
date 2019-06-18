﻿using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace SimplyBlog.Core.Models
{
    public class Post : Entity<int>
    {
        [Required]
        public string Title { get; set; }
        public string Content { get; set; }
        public DateTime Created { get; set; } = DateTime.UtcNow;
        public DateTime LastModified { get; set; } = DateTime.UtcNow;
        public List<string> Categories { get; set; } = new List<string>();
        public List<Comment> Comments { get; set; } = new List<Comment>();
    }
}
