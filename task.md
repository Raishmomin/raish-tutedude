Repo Structure:

```
terraform-flask-express-deploy/
├── flask-app/
│   └── Dockerfile
│   └── app.py
├── express-app/
│   └── Dockerfile
│   └── app.js
├── modules/
│   ├── ecr/
│   │   └── main.tf
│   │   └── variables.tf
│   │   └── outputs.tf
│   ├── vpc/
│   │   └── main.tf
│   │   └── variables.tf
│   │   └── outputs.tf
│   ├── ecs/
│   │   └── main.tf
│   │   └── variables.tf
│   │   └── outputs.tf
│   └── alb/
│       └── main.tf
│       └── variables.tf
│       └── outputs.tf
├── main.tf
├── variables.tf
├── outputs.tf
├── terraform.tfvars
└── README.md
```

---

### Step-by-step file contents

#### 1. `modules/ecr/main.tf`
```hcl
resource "aws_ecr_repository" "flask" {
  name = "flask-repo"
}

resource "aws_ecr_repository" "express" {
  name = "express-repo"
}
```

#### 2. `modules/ecr/outputs.tf`
```hcl
output "flask_repo_url" {
  value = aws_ecr_repository.flask.repository_url
}

output "express_repo_url" {
  value = aws_ecr_repository.express.repository_url
}
```

#### 3. `modules/ecr/variables.tf`
```hcl
# No variables needed for ECR
```

---

#### 4. `modules/vpc/main.tf`
```hcl
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags = {
    Name = "main-vpc"
  }
}

resource "aws_subnet" "public" {
  count = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(aws_vpc.main.cidr_block, 8, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true
  tags = {
    Name = "public-subnet-${count.index}"
  }
}

resource "aws_internet_gateway" "gw" {
  vpc_id = aws_vpc.main.id
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
}

resource "aws_route" "internet_access" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.gw.id
}

resource "aws_route_table_association" "a" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

data "aws_availability_zones" "available" {}
```

#### 5. `modules/vpc/outputs.tf`
```hcl
output "vpc_id" {
  value = aws_vpc.main.id
}

output "public_subnets" {
  value = aws_subnet.public[*].id
}
```

#### 6. `modules/vpc/variables.tf`
```hcl
# No external input variables
```

---

#### 7. `modules/alb/main.tf`
```hcl
resource "aws_lb" "app" {
  name               = "app-lb"
  internal           = false
  load_balancer_type = "application"
  subnets            = var.public_subnets
  security_groups    = [var.lb_sg_id]
}

resource "aws_lb_target_group" "flask" {
  name     = "flask-tg"
  port     = 5000
  protocol = "HTTP"
  vpc_id   = var.vpc_id
}

resource "aws_lb_target_group" "express" {
  name     = "express-tg"
  port     = 3000
  protocol = "HTTP"
  vpc_id   = var.vpc_id
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.app.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.express.arn
  }
}
```

#### 8. `modules/alb/variables.tf`
```hcl
variable "vpc_id" {}
variable "public_subnets" {}
variable "lb_sg_id" {}
```

#### 9. `modules/alb/outputs.tf`
```hcl
output "alb_dns" {
  value = aws_lb.app.dns_name
}

output "flask_target_group" {
  value = aws_lb_target_group.flask.arn
}

output "express_target_group" {
  value = aws_lb_target_group.express.arn
}
```

---

#### 10. `modules/ecs/main.tf`
```hcl
resource "aws_ecs_cluster" "main" {
  name = "app-cluster"
}

resource "aws_ecs_task_definition" "flask" {
  family                   = "flask-task"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = var.execution_role_arn

  container_definitions = jsonencode([
    {
      name      = "flask"
      image     = var.flask_image
      portMappings = [
        {
          containerPort = 5000
        }
      ]
    }
  ])
}

resource "aws_ecs_task_definition" "express" {
  family                   = "express-task"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = var.execution_role_arn

  container_definitions = jsonencode([
    {
      name      = "express"
      image     = var.express_image
      portMappings = [
        {
          containerPort = 3000
        }
      ]
    }
  ])
}

resource "aws_ecs_service" "flask" {
  name            = "flask-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.flask.arn
  desired_count   = 1
  launch_type     = "FARGATE"
  network_configuration {
    subnets         = var.public_subnets
    security_groups = [var.service_sg_id]
    assign_public_ip = true
  }
  load_balancer {
    target_group_arn = var.flask_tg
    container_name   = "flask"
    container_port   = 5000
  }
}

resource "aws_ecs_service" "express" {
  name            = "express-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.express.arn
  desired_count   = 1
  launch_type     = "FARGATE"
  network_configuration {
    subnets         = var.public_subnets
    security_groups = [var.service_sg_id]
    assign_public_ip = true
  }
  load_balancer {
    target_group_arn = var.express_tg
    container_name   = "express"
    container_port   = 3000
  }
}
```

#### 11. `modules/ecs/variables.tf`
```hcl
variable "public_subnets" {}
variable "service_sg_id" {}
variable "execution_role_arn" {}
variable "flask_image" {}
variable "express_image" {}
variable "flask_tg" {}
variable "express_tg" {}
```

#### 12. `modules/ecs/outputs.tf`
```hcl
output "cluster_name" {
  value = aws_ecs_cluster.main.name
}
```

---

#### 13. `main.tf`, `variables.tf`, `outputs.tf` and `terraform.tfvars`
These files glue everything together in the root module. Let me generate those next if you’re ready.

Would you like me to continue with `main.tf` and rest?
