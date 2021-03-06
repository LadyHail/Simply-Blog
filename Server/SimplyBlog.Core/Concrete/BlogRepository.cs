﻿using System;
using System.Collections.Generic;
using System.Linq;
using SimplyBlog.Core.Abstract;
using SimplyBlog.Core.Models;

namespace SimplyBlog.Core.Concrete
{
    public class BlogRepository : Repository<Post>, IBlogRepository
    {
        public BlogRepository(XmlContext context) : base(context)
        {

        }

        public override void Create(Post entity)
        {
            if (Entities.Count() == 0)
            {
                entity.Id = 0;
            }
            else
            {
                entity.Id = Entities.Max(x => x.Id) + 1;
            }
            base.Create(entity);
        }

        public IEnumerable<string> GetTags()
        {
            return Entities.SelectMany(x => x.Categories).Distinct();
        }

        public IEnumerable<Post> GetPosts(int page, string category)
        {
            IEnumerable<Post> result = Entities
                    .OrderByDescending(x => x.Created);

            if (!string.IsNullOrWhiteSpace(category))
            {
                result = result
                    .Where(x => x.Categories.Contains(category));
            }

            return result
                    .Skip(5 * (page))
                    .Take(5);
        }

        public int GetMaxPages(string category)
        {
            if (!string.IsNullOrWhiteSpace(category))
            {
                return (int)(Math.Ceiling(Entities.Where(x => x.Categories.Contains(category)).Count() / 5m));
            }

            return (int)(Math.Ceiling(Entities.Count() / 5m));
        }

        public Post GetById(long id)
        {
            return Entities.FirstOrDefault(x => x.Id == id);
        }

        public void AddComment(Post post, Comment comment)
        {
            comment.PostId = post.Id;
            comment.Id = Guid.NewGuid();
            post.Comments.Add(comment);
            Update(post);
        }

        public void DeleteComment(Post post, Comment comment)
        {
            post.Comments.Remove(comment);
            Update(post);
        }
    }
}
