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
    private TaskEntryService taskService;

    @Autowired
    private UserService userService;

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getAllTasks(@PathVariable("userId") ObjectId userId) {

        User user = userService.findById(userId);
        List<TaskEntry> all = user.getTaskEntries();

        if (all != null && !all.isEmpty()) {
            return new ResponseEntity<>(all, HttpStatus.OK);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @PostMapping("/{userName}")
    public ResponseEntity<Object> CreateData(@RequestBody TaskEntry myEntry,
            @PathVariable("userName") String userName) {
        try {
            User user = userService.findByUserName(userName);
            TaskEntry saved = taskService.saveEntry(myEntry, user.getId());
            return new ResponseEntity<>(saved, HttpStatus.CREATED);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(java.util.Map.of("message", "Error: " + e.getMessage()),
                    HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/id/{myid}")
    public ResponseEntity<?> findById(@PathVariable("myid") ObjectId myid) {
        Optional<?> taskEntry = taskService.findById(myid);
        if (taskEntry.isPresent()) {
            return new ResponseEntity<>(taskEntry.get(), HttpStatus.OK);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @DeleteMapping("/id/{userName}/{myId}")
    public ResponseEntity<TaskEntry> deleteById(@PathVariable("myId") ObjectId myId,
            @PathVariable("userName") String userName) {
        User user = userService.findByUserName(userName);
        taskService.deleteById(myId, user.getId());
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    @PutMapping("/id/{userName}/{myId}")
    public ResponseEntity<?> updateById(
            @PathVariable("myId") ObjectId myId,
            @PathVariable("userName") String userName,
            @RequestBody TaskEntry newEntry) {

        TaskEntry old = taskService.findById(myId).orElse(null);

        if (old != null) {
            old.setTitle(newEntry.getTitle() != null && !newEntry.getTitle().isEmpty() ? newEntry.getTitle()
                    : old.getTitle());
            old.setDescription(newEntry.getDescription() != null && !newEntry.getDescription().isEmpty()
                    ? newEntry.getDescription()
                    : old.getDescription());
            old.setCompleted(newEntry.isCompleted());
            old.setDueDate(newEntry.getDueDate());
            old.setPriority(newEntry.getPriority());

            TaskEntry updated = taskService.updateEntry(old);
            return new ResponseEntity<>(updated, HttpStatus.OK);
        }

        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

}
