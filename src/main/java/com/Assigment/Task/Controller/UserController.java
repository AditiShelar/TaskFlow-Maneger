package com.Assigment.Task.Controller;

import com.Assigment.Task.Entity.User;
import com.Assigment.Task.service.UserService;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.mongodb.MongoWriteException;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/User")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping
    public List<User> getAllUsers() {
        return userService.getAll();
    }

    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody User user) {
        if (user.getTaskEntries() == null) {
            user.setTaskEntries(new ArrayList<>());
        }
        try {
            userService.SaveEntry(user);
            return new ResponseEntity<>(HttpStatus.CREATED);
        } catch (MongoWriteException e) {
            if (e.getCode() == 11000) { // Duplicate key error code
                return new ResponseEntity<>(java.util.Map.of("message", "Username already taken"), HttpStatus.CONFLICT);
            }
            return new ResponseEntity<>(java.util.Map.of("message", "Database error: " + e.getMessage()),
                    HttpStatus.BAD_REQUEST);
        } catch (DuplicateKeyException e) {
            return new ResponseEntity<>(java.util.Map.of("message", "Username already taken"), HttpStatus.CONFLICT);
        } catch (Exception e) {
            e.printStackTrace(); // Log error for debugging
            String errorMsg = e.getMessage() != null ? e.getMessage() : "Bad request";
            return new ResponseEntity<>(java.util.Map.of("message", errorMsg), HttpStatus.BAD_REQUEST);
        }
    }

    @PutMapping("/{userName}")
    public ResponseEntity<?> updateUser(@RequestBody User user, @PathVariable("userName") String userName) {

        User userInDB = userService.findByUserName(userName);

        if (userInDB != null) {
            userInDB.setUserName(user.getUserName());
            System.out.println("New Password: " + user.getPassword());

            userInDB.setPassword(user.getPassword());
            userService.SaveEntry(userInDB);
        }
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User user) {
        User userInDB = userService.findByUserName(user.getUserName());
        if (userInDB != null && userInDB.getPassword().equals(user.getPassword())) {
            return new ResponseEntity<>(userInDB, HttpStatus.OK);
        }
        return new ResponseEntity<>(java.util.Map.of("message", "Invalid username or password"),
                HttpStatus.UNAUTHORIZED);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteByUser(@PathVariable("id") ObjectId id) {
        if (userService.getById(id).isEmpty()) {
            return new ResponseEntity<>("User not found", HttpStatus.NOT_FOUND);
        }
        userService.deleteById(id);
        return new ResponseEntity<>("User deleted successfully", HttpStatus.OK);
    }
}
