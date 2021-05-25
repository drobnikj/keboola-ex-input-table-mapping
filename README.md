# Keboola Input mapping

Actor parses input table from Apify <> Keboola extractor and maps the data into another task or actor input.

<!-- toc start -->
- Introduction
- Use Case - Web Scraper
- Input
 <!-- toc end -->

## Introduction

It is not possible pass input table from Keboola extractor into any public actor. Because Keboola extractor passed
input table using key-value store and the storeId and key of the input table puts into actor/task input. And because
storeId and key is not part of any public actor and will be omitted. This tool helps you to run actor/task from Keboola
extractor and map the input table into actor/task input.

## Use Case - Web Scraper

Imagine we have in Keboola tabled data in CSV in this format:
```csv
Title,URL,ID
Test1,http://example.com#1,product_1
Test2,http://example.com#2,product_2
Test3,http://example.com#3,product_3
Test4,http://example.com#4,product_4
Test5,http://example.com#5,product_5
```
We need to run the task of apify/web-scraper, where URL column will be use on input as "Start URLs".
In this case we will create new task of this actor, we can use this link. We will fill
"Target Task ID" with name of created web-scraper task and
"Input mapping function" with simple Javascript function which maps CSV into input.
```javascript
function inputMappingFunction({ currentInput, parsedInputTableCsv }) {
    const startUrls = parsedInputTableCsv.map((line) => {
        return { url: line['URL'] };
    });
    return {
        startUrls,
    };
}
```
We will save the task and go to Keboola and use created task in Apify extractor and select table which we
want to pass.
![Keboola-ex](./keboola-ex.png)
After save and run this configuration the task should be run our target task and use input created in mapping function.

## Miscellaneous

If you are struggling with the Apify <> Keboola setup, please contact me or [Apify support](mailto:support@apify.com).




