using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Ksp.WebServer.Controllers
{
    [ApiController]
    [Route("tasks.json")]
    public class TasksController : ControllerBase
    {
        private readonly ILogger<TasksController> logger;
        private readonly IWebHostEnvironment env;
        private readonly KspAuthenticator auth;

        public TasksController(ILogger<TasksController> logger, IWebHostEnvironment env, KspAuthenticator auth)
        {
            this.auth = auth;
            this.env = env;
            this.logger = logger;
        }

        string TasksJsonFile(string suffix) => Path.Combine(env.ContentRootPath, $"../../tasks{suffix}.json");

        string KspAuthCookie => this.HttpContext.Request.Cookies["ksp_auth"];

        [HttpGet]
        public IActionResult Get()
        {
            string file = null;
            if (KspAuthCookie is object)
            {
                var user = KspAuthenticator.ParseAuthCookie(KspAuthCookie);
                file = TasksJsonFile("-" + user.Id.Value);
                if (!System.IO.File.Exists(file))
                    file = null;
            }

            file ??= TasksJsonFile("");

            return this.PhysicalFile(file, "text/json");
        }

        [HttpPost]
        public async Task<IActionResult> Post()
        {
            string suffix;
            if (env.IsDevelopment())
            {
                suffix = "";
            }
            else
            {
                if (KspAuthCookie is null)
                    return StatusCode(401);
                var user = await auth.VerifyUser(KspAuthCookie);
                if (user == null)
                    return StatusCode(403);
                suffix = "-" + user.Id.Value;
            }

            using var rdr = new StreamReader(HttpContext.Request.Body);
            await System.IO.File.WriteAllTextAsync(TasksJsonFile(suffix), await rdr.ReadToEndAsync());
            return Ok();
        }

        [HttpDelete]
        public async Task<IActionResult> Delete()
        {
            if (env.IsDevelopment())
            {
                return BadRequest();
            }
            else
            {
                if (KspAuthCookie is null)
                    return StatusCode(401);
                var user = await auth.VerifyUser(KspAuthCookie);
                if (user == null)
                    return StatusCode(403);
                System.IO.File.Delete(TasksJsonFile("-" + user.Id.Value));
                return Ok();
            }
        }
    }
}
