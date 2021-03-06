﻿using System;
using Microsoft.Extensions.Options;

namespace SimplyBlog.Website.Configuration
{
    public interface IWritableOptions<out T> : IOptions<T> where T : class, new()
    {
        void Update(Action<T> applyChanges);
    }
}
