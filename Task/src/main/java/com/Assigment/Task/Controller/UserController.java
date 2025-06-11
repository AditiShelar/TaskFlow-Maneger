package com.Assigment.Task.Controller;

import com.Assigment.Task.Entity.User;
import com.Assigment.Task.service.UserService;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/User")
public class UserController {


    @Autowired
    private UserService userService ;

    @GetMapping
    public List<User> getAllUsers(){
        return  userService.getAll();
    }




    @PostMapping
    public void createUser(@RequestBody User user){
        userService.SaveEntry(user);

    }


    @PutMapping("/{userName}")
    public ResponseEntity<?> updateUser(@RequestBody User user, @PathVariable String userName) {

        User userInDB = userService.findByUserName(userName);

        if (userInDB != null) {
            userInDB.setUserName(user.getUserName());
            System.out.println("New Password: " + user.getPassword());

            userInDB.setPassword(user.getPassword());
            userService.SaveEntry(userInDB);
        }
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteByUser(@PathVariable ObjectId id) {
        if (userService.getById(id) == null) { // Fixed method name
            return new ResponseEntity<>("User not found", HttpStatus.NOT_FOUND);
        }
        userService.deleteById(id);
        return new ResponseEntity<>("User deleted successfully", HttpStatus.OK);
    }
}
