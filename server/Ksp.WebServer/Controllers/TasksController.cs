using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace Ksp.WebServer.Controllers
{
    [ApiController]
    [Route("tasks.json")]
    public class TasksController : ControllerBase
    {
        private readonly ILogger<TasksController> logger;
        private readonly IWebHostEnvironment env;

        public TasksController(ILogger<TasksController> logger, IWebHostEnvironment env)
        {
            this.env = env;
            this.logger = logger;
        }

        [HttpGet]
        public IActionResult Get()
        {
            return this.PhysicalFile(Path.Combine(env.ContentRootPath, "../../tasks.json"), "text/json");
        }
    }
}
