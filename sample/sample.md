# NRCM Sample Application

## Structure

```
├── sample/
│   ├── src/
│   │   ├── Config/
│   │   ├───├── core.json
│   │   ├── Component/
│   │   ├───├── ...
│   │   ├── Controller/
│   │   ├───├── Recipes.js
│   │   ├───├── Ingredients.js
│   │   ├───├── Categories.js
│   │   ├───├── People/
│   │   ├───├──├── Chefs.js
│   │   ├───├──├── Cookers.js
│   │   ├── Model/
│   │   ├───├── Recipe.js
│   │   ├───├── Ingredient.js
│   │   ├───├── Category.js
│   │   ├───├── People/
│   │   ├───├──├── Chef.js
│   │   ├───├──├── Cooker.js
│   ├── test/
│   │   ├── Component/
│   │   ├── Controller/
│   │   ├── Model/
│   ├── logs/
│   │   ├── main.log
│   │   ├── exceptions.log
├── sample.js
```
## Available Requests

```bash 
$ curl -XGET http://localhost:8001/sample/recipes               # Get all recipes
$ curl -XGET http://localhost:8001/sample/recipes/:id           # Get a single recipe
$ curl -XPUT http://localhost:8001/sample/recipes/:id           # Create a new recipe
$ curl -XPOST http://localhost:8001/sample/recipes/:id          # Change a recipe
$ curl -XDELETE http://localhost:8001/sample/recipes/:id        # Remove a recipe

$ curl -XGET http://localhost:8001/sample/ingredients           # Get all ingredients    
$ curl -XGET http://localhost:8001/sample/ingredients/:id       # Get a single ingredient
$ curl -XPUT http://localhost:8001/sample/ingredients/:id       # Create a new ingredient
$ curl -XPOST http://localhost:8001/sample/ingredients/:id      # Change an ingredient
$ curl -XDELETE http://localhost:8001/sample/ingredients/:id    # Remove an ingredient

$ curl -XGET http://localhost:8001/sample/people/chefs          # Get all chefs
$ curl -XGET http://localhost:8001/sample/people/chefs/:id      # Get a chef
$ curl -XPUT http://localhost:8001/sample/people/chefs/:id      # Create a new chef
$ curl -XPOST http://localhost:8001/sample/people/chefs/:id     # Change a chef
$ curl -XDELETE http://localhost:8001/sample/people/chefs/:id   # Remove a chef

$ curl -XGET http://localhost:8001/sample/people/cookers        # Get all cookers
$ curl -XGET http://localhost:8001/sample/people/cookers/:id    # Get a cooker
$ curl -XPUT http://localhost:8001/sample/people/cookers/:id    # Create a cooker
$ curl -XPOST http://localhost:8001/sample/people/cookers/:id   # Change a cooker
$ curl -XDELETE http://localhost:8001/sample/people/cookers/:id # Remove a cooker
```
## 