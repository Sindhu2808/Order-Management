package com.techie.microservices.product;

import io.restassured.RestAssured;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Import;
import org.testcontainers.containers.MongoDBContainer;

import static org.hamcrest.Matchers.*; // ✅ Import Matchers statically

@Import(TestcontainersConfiguration.class)
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ProductServiceApplicationTests {

	@ServiceConnection
	static MongoDBContainer mongoDBContainer = new MongoDBContainer("mongo:7.0.5");

	@LocalServerPort
	private Integer port;

	@BeforeEach
	void setUp() {
		RestAssured.baseURI = "http://localhost";
		RestAssured.port = port;
	}

	static {
		mongoDBContainer.start();
	}

	@Test
	void shouldCreateProduct() {
		String requestBody = """
                {
                "name": "Iphone 15",
                "description": "Iphone 15 is smart phone from Apple",
                "price": 100000
                }
                """;

		RestAssured.given()
				.contentType("application/json")
				.body(requestBody)
				.when()
				.post("/api/product") // Ensure this matches your controller mapping
				.then()
				.statusCode(201)
				.body("id", notNullValue()) // ✅ No need for Matchers.notNullValue()
				.body("name", equalTo("Iphone 15"))
				.body("description", equalTo("Iphone 15 is smart phone from Apple"))
				.body("price", equalTo(100000)); // ✅ Ensures price is treated as a number
	}
}
