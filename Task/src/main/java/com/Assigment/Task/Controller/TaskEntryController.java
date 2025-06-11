package com.Assigment.Task.Controller;

import com.Assigment.Task.Entity.TaskEntry;
import com.Assigment.Task.service.TaskEntryService;
import com.Assigment.Task.service.UserService;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.Assigment.Task.Entity.User;
import java.util.List;
import java.util.Optional;


@RestController
@RequestMapping("/Task")


public class TaskEntryController {

    @Autowired
    private TaskEntryService taskService ;

    @Autowired
    private UserService userService;

    @GetMapping("/{userName}")
    public ResponseEntity<?> getAll(@PathVariable String userName){
        User user = userService.findByUserName(userName);
        List<TaskEntry> all = user.getTaskEntries();
        if(all != null  && !all.isEmpty()){
            return  new ResponseEntity<>(all, HttpStatus.OK);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @PostMapping("/{userName}")
    public ResponseEntity<Object> CreateData(@RequestBody  TaskEntry myEntry , @PathVariable String userName){
        try {
            User user = userService.findByUserName(userName);
            taskService.SaveEntry(myEntry , userName);
            return new ResponseEntity<>(myEntry,HttpStatus.CREATED);
        }catch (Exception e){
            return  new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/id/{myid}")
    public ResponseEntity<?> findById(@PathVariable ObjectId myid){
        Optional<?> taskEntry = taskService.findbyID(myid);
        if (taskEntry.isPresent()){
            return new ResponseEntity<>(taskEntry.get(), HttpStatus.OK);
        }
        return  new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @DeleteMapping("/id/{userName}/{myId}")
    public ResponseEntity<TaskEntry> deleteById (@PathVariable ObjectId myId, @PathVariable String userName){
        taskService.deletebyId(myId, userName);
        return  new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }


    @PutMapping("/id/{myId}")
    public ResponseEntity<?> updateById(
            @PathVariable ObjectId myId,
            @PathVariable String userName ,
            @RequestBody TaskEntry newEntry) {

        TaskEntry old = taskService.findbyID(myId).orElse(null);

        if (old != null) {
            old.setTitle(newEntry.getTitle() != null && !newEntry.getTitle().isEmpty() ? newEntry.getTitle() : old.getTitle());
            old.setDescription(newEntry.getDescription() != null && !newEntry.getDescription().isEmpty() ? newEntry.getDescription() : old.getDescription());
            old.setCompleted(newEntry.isCompleted()); // Update completed status

            taskService.SaveEntry(old ,userName);
            return new ResponseEntity<>(old,HttpStatus.OK);
        }

        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }




}
