# ./vendor/bin/behat -c tests/Integration/Behaviour/behat.yml -s product --tags generate-combinations
@reset-database-before-feature
@clear-cache-before-feature
@product-combination
@generate-combinations
Feature: Generate attribute combinations for product in Back Office (BO)
  As an employee
  I need to be able to generate product attribute combinations from BO

  Background:
    Given language with iso code "en" is the default one
    And attribute group "Size" named "Size" in en language exists
    And attribute group "Color" named "Color" in en language exists
    And attribute "S" named "S" in en language exists
    And attribute "M" named "M" in en language exists
    And attribute "L" named "L" in en language exists
    And attribute "White" named "White" in en language exists
    And attribute "Black" named "Black" in en language exists
    And attribute "Blue" named "Blue" in en language exists
    And attribute "Red" named "Red" in en language exists

  Scenario: Generate product combinations
    Given product "product1" combinations list search criteria is set to defaults
    When I add product "product1" with following information:
      | name[en-US] | universal T-shirt |
      | type        | combinations      |
    Then product product1 type should be combinations
    And product product1 does not have a default combination
    When I generate combinations for product product1 using following attributes:
      | Size  | [S,M]              |
      | Color | [White,Black,Blue] |
    Then I should see following combinations list of product "product1":
      | reference      | combination name        | combination reference | attributes           | impact on price | final price | quantity | is default |
      | product1SWhite | Size - S, Color - White |                       | [Size:S,Color:White] | 0               | 0           | 0        | true       |
      | product1SBlack | Size - S, Color - Black |                       | [Size:S,Color:Black] | 0               | 0           | 0        | false      |
      | product1Blue   | Size - S, Color - Blue  |                       | [Size:S,Color:Blue]  | 0               | 0           | 0        | false      |
      | product1MWhite | Size - M, Color - White |                       | [Size:M,Color:White] | 0               | 0           | 0        | false      |
      | product1MBlack | Size - M, Color - Black |                       | [Size:M,Color:Black] | 0               | 0           | 0        | false      |
      | product1MBlue  | Size - M, Color - Blue  |                       | [Size:M,Color:Blue]  | 0               | 0           | 0        | false      |
    And product product1 default combination should be "product1SWhite"
